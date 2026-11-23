import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { decodeFlow, fetchGoogleProfile, GOOGLE_COOKIE, googleEnabled, sameValue } from '@/lib/google'
import { safeNext } from '@/lib/member'
import { startMemberSession } from '@/lib/memberSession'
import { getPayloadClient } from '@/lib/payload'
import { siteUrl } from '@/lib/payments/provider'

export const dynamic = 'force-dynamic'

const randomPassword = () => randomBytes(32).toString('base64url')

/**
 * Retour de Google. Trouve ou crée le compte membre, puis ouvre la session.
 * Le compte n'a AUCUN accès au livre tant que l'abonnement n'est pas payé :
 * il arrive sur la page d'abonnement (l'espace membre le renvoie là).
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const jar = await cookies()
  const flow = decodeFlow(jar.get(GOOGLE_COOKIE)?.value)
  jar.delete({ name: GOOGLE_COOKIE, path: '/espace-membre/google' })

  const fail = (code = 'google') => NextResponse.redirect(`${siteUrl()}/espace-membre/connexion?erreur=${code}`)
  if (!googleEnabled()) return fail('google-indisponible')
  // L'utilisateur a fermé la fenêtre Google ou refusé
  if (params.get('error')) return fail('google-annule')

  const code = params.get('code') || ''
  const state = params.get('state') || ''
  if (!flow || !code || !state || !sameValue(state, flow.state)) return fail()

  try {
    const profile = await fetchGoogleProfile(code, flow)
    const payload = await getPayloadClient()

    const byGoogle = await payload.find({
      collection: 'members',
      where: { googleId: { equals: profile.sub } },
      limit: 1,
      depth: 0,
    })
    let memberId = byGoogle.docs[0]?.id
    let resetSessions = false

    if (!memberId) {
      const byEmail = await payload.find({
        collection: 'members',
        where: { email: { equals: profile.email } },
        limit: 1,
        depth: 0,
      })
      const existing = byEmail.docs[0]
      if (existing) {
        // Compte email existant : Google prouve que cet email appartient à la personne.
        // On remplace le mot de passe (inconnu de tous) et on ferme les autres sessions,
        // pour qu'un compte créé par quelqu'un d'autre avec cet email ne puisse plus servir.
        await payload.update({
          collection: 'members',
          id: existing.id,
          data: { googleId: profile.sub, password: randomPassword(), ...(existing.name ? {} : { name: profile.name }) },
          depth: 0,
        })
        memberId = existing.id
        resetSessions = true
      } else {
        const created = await payload.create({
          collection: 'members',
          data: { email: profile.email, name: profile.name || undefined, googleId: profile.sub, password: randomPassword() },
          depth: 0,
        })
        memberId = created.id
      }
    }

    await startMemberSession(payload, memberId, { resetSessions })
    const res = NextResponse.redirect(`${siteUrl()}${safeNext(flow.next)}`)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error('[membre] connexion Google', err)
    return fail()
  }
}
