import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { siteUrl } from './payments/provider'

/**
 * Connexion « Continuer avec Google » (OpenID Connect, flux « code » + PKCE).
 * Active seulement si GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET sont définis (Vercel).
 * Se connecter avec Google crée ou ouvre un compte membre : cela ne donne AUCUN accès
 * au livre. L'espace membre reste fermé tant que l'abonnement n'est pas payé.
 */
export const googleEnabled = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export const GOOGLE_COOKIE = 'inhabit-google'
export const googleRedirectUri = () => `${siteUrl()}/espace-membre/google/retour`

const b64url = (buf: Buffer) => buf.toString('base64url')

export type GoogleFlow = { state: string; nonce: string; verifier: string; next: string }

/** Prépare une connexion : valeurs à garder en cookie et adresse de la page Google. */
export function startGoogleFlow(next: string): { flow: GoogleFlow; url: string } {
  const flow: GoogleFlow = {
    state: b64url(randomBytes(24)),
    nonce: b64url(randomBytes(24)),
    verifier: b64url(randomBytes(48)),
    next,
  }
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: googleRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: b64url(createHash('sha256').update(flow.verifier).digest()),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  })
  return { flow, url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }
}

export const encodeFlow = (f: GoogleFlow) => Buffer.from(JSON.stringify(f)).toString('base64url')

export function decodeFlow(value: string | undefined): GoogleFlow | null {
  if (!value) return null
  try {
    const f = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (typeof f?.state === 'string' && typeof f?.nonce === 'string' && typeof f?.verifier === 'string') {
      return { state: f.state, nonce: f.nonce, verifier: f.verifier, next: String(f.next ?? '') }
    }
  } catch {
    /* cookie illisible */
  }
  return null
}

export const sameValue = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export type GoogleProfile = { sub: string; email: string; name: string }

/**
 * Échange le code contre l'identité Google et la vérifie.
 * Le jeton d'identité arrive directement de Google (HTTPS, avec notre secret) :
 * on contrôle l'émetteur, le destinataire, l'expiration, le nonce et l'email vérifié.
 */
export async function fetchGoogleProfile(code: string, flow: GoogleFlow): Promise<GoogleProfile> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: googleRedirectUri(),
      grant_type: 'authorization_code',
      code_verifier: flow.verifier,
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Google a refusé le code (${res.status})`)
  const { id_token: idToken } = (await res.json()) as { id_token?: string }
  const part = idToken?.split('.')[1]
  if (!part) throw new Error('Réponse Google sans identité')
  const claims = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>

  const issuerOk = claims.iss === 'https://accounts.google.com' || claims.iss === 'accounts.google.com'
  const audienceOk = claims.aud === process.env.GOOGLE_CLIENT_ID
  const notExpired = typeof claims.exp === 'number' && claims.exp * 1000 > Date.now()
  const nonceOk = typeof claims.nonce === 'string' && sameValue(claims.nonce, flow.nonce)
  const verified = claims.email_verified === true || claims.email_verified === 'true'
  if (!issuerOk || !audienceOk || !notExpired || !nonceOk) throw new Error('Identité Google invalide')
  if (!verified || typeof claims.email !== 'string' || typeof claims.sub !== 'string') {
    throw new Error('Email Google non vérifié')
  }
  return {
    sub: claims.sub,
    email: claims.email.trim().toLowerCase(),
    name: typeof claims.name === 'string' ? claims.name.trim().slice(0, 120) : '',
  }
}
