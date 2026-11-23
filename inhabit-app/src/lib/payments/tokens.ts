import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Lien de paiement signé pour une réservation d'accompagnement :
 * impossible de deviner le lien d'une autre réservation sans le secret du site.
 */
const sign = (value: string) =>
  createHmac('sha256', process.env.PAYLOAD_SECRET || 'dev-secret').update(`coaching:${value}`).digest('base64url').slice(0, 32)

export const coachingPayToken = (bookingId: string | number) => sign(String(bookingId))

export function verifyCoachingPayToken(bookingId: string, token: string) {
  const expected = Buffer.from(sign(bookingId))
  const given = Buffer.from(token || '')
  return expected.length === given.length && timingSafeEqual(expected, given)
}

export const coachingPayUrl = (bookingId: string | number) => {
  const base = (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/$/, '')
  return `${base}/paiement/accompagnement?ref=${bookingId}&k=${coachingPayToken(bookingId)}`
}
