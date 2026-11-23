/**
 * Règle unique « ce membre peut-il lire le livre complet ? »
 * - bookAccess coché ;
 * - et pas de date de fin, ou une date de fin encore à venir (abonnement).
 */
export type AccessFields = { bookAccess?: boolean | null; bookAccessUntil?: string | null }

export function hasBookAccess(m?: AccessFields | null, now = new Date()) {
  if (!m?.bookAccess) return false
  if (!m.bookAccessUntil) return true
  return new Date(m.bookAccessUntil).getTime() > now.getTime()
}

/** Nouvelle date de fin après un achat de `days` jours (prolonge un abonnement en cours). */
export function extendAccess(current: string | null | undefined, days: number, now = new Date()) {
  const start = current && new Date(current) > now ? new Date(current) : now
  return new Date(start.getTime() + days * 86_400_000).toISOString()
}
