import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { Member } from '@/payload-types'
import { getPayloadClient } from './payload'

/** Membre connecté (compte lecteur du site), ou null. Un administrateur n'est pas un membre. */
export const getMember = cache(async (): Promise<Member | null> => {
  const payload = await getPayloadClient()
  try {
    const { user } = await payload.auth({ headers: await headers() })
    if (user && user.collection === 'members') return user as Member
  } catch {
    /* jeton invalide ou expiré */
  }
  return null
})

/** Pour les pages de l'espace membre : renvoie vers la connexion si besoin. */
export async function requireMember(next = '/espace-membre'): Promise<Member> {
  const member = await getMember()
  if (!member) redirect(`/espace-membre/connexion?suite=${encodeURIComponent(next)}`)
  return member
}

/** N'accepte qu'un chemin interne pour la redirection après connexion. */
export const safeNext = (value: unknown, fallback = '/espace-membre') => {
  const v = String(value ?? '')
  return v.startsWith('/') && !v.startsWith('//') ? v : fallback
}

export const firstName = (m: Pick<Member, 'name' | 'email'>) =>
  (m.name || '').trim().split(/\s+/)[0] || m.email.split('@')[0]
