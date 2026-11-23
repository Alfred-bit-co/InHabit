import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { generatePayloadCookie, getFieldsToSign, jwtSign, type Payload } from 'payload'

type SessionRow = { id: string; createdAt?: Date | string | null; expiresAt: Date | string }

/**
 * Ouvre une session membre sans mot de passe (après la connexion Google).
 * Reproduit ce que fait la connexion Payload : session enregistrée sur le compte,
 * jeton signé avec le secret Payload, cookie httpOnly identique.
 * `resetSessions` ferme d'abord toutes les autres sessions du compte.
 */
export async function startMemberSession(payload: Payload, memberId: number, { resetSessions = false } = {}) {
  const collectionConfig = payload.collections.members.config
  const auth = collectionConfig.auth
  const user = (await payload.db.findOne({ collection: 'members', where: { id: { equals: memberId } } })) as
    | (Record<string, unknown> & { id: number; email: string; sessions?: SessionRow[] | null })
    | null
  if (!user) throw new Error('Compte introuvable')

  let sid: string | undefined
  if (auth.useSessions) {
    sid = randomUUID()
    const now = new Date()
    const kept = resetSessions ? [] : (user.sessions ?? []).filter((s) => new Date(s.expiresAt) > now)
    user.sessions = [...kept, { id: sid, createdAt: now, expiresAt: new Date(now.getTime() + auth.tokenExpiration * 1000) }]
    // Comme Payload : ne pas toucher à la date de modification pour une simple connexion
    user.updatedAt = null
    await payload.db.updateOne({ collection: 'members', id: user.id, data: user, returning: false })
  }

  const fieldsToSign = getFieldsToSign({
    collectionConfig,
    email: user.email,
    sid,
    user: { ...user, collection: 'members' } as never,
  })
  const { token } = await jwtSign({ fieldsToSign, secret: payload.secret, tokenExpiration: auth.tokenExpiration })

  const cookie = generatePayloadCookie({
    collectionAuthConfig: auth,
    cookiePrefix: payload.config.cookiePrefix,
    returnCookieAsObject: true,
    token,
  })
  if (!cookie.value) throw new Error('Cookie de session vide')
  ;(await cookies()).set(cookie.name, cookie.value, {
    domain: auth.cookies.domain,
    expires: cookie.expires ? new Date(cookie.expires) : undefined,
    httpOnly: true,
    path: '/',
    sameSite: typeof auth.cookies.sameSite === 'string' ? (auth.cookies.sameSite.toLowerCase() as 'lax') : 'lax',
    secure: auth.cookies.secure || false,
  })
}
