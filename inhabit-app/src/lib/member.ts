import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { Member } from '@/payload-types'
import { hasBookAccess } from './bookAccess'
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

/** Page où un membre sans abonnement actif choisit et paie son accès. */
export const SUBSCRIBE_PATH = '/espace-membre/abonnement'

/**
 * Pour TOUTES les pages de l'espace membre : il faut être connecté ET abonné.
 * Un compte créé (email ou Google) sans paiement confirmé n'entre pas : il est
 * envoyé vers la page d'abonnement.
 */
export async function requireSubscriber(next = '/espace-membre'): Promise<Member> {
  const member = await requireMember(next)
  if (!hasBookAccess(member)) redirect(SUBSCRIBE_PATH)
  return member
}

/** Membre connecté ET abonné, ou null (pour les actions et routes). */
export async function getSubscriber(): Promise<Member | null> {
  const member = await getMember()
  return member && hasBookAccess(member) ? member : null
}

/**
 * N'accepte qu'un chemin interne pour la redirection après connexion.
 * Refuse « //site » et « /\site » (lus comme une autre adresse par les navigateurs) et les caractères de contrôle.
 */
export const safeNext = (value: unknown, fallback = '/espace-membre') => {
  const v = String(value ?? '')
  return v.startsWith('/') && !v.startsWith('//') && !/[\\\u0000-\u001f]/.test(v) ? v : fallback
}

export const firstName = (m: Pick<Member, 'name' | 'email'>) =>
  (m.name || '').trim().split(/\s+/)[0] || m.email.split('@')[0]
