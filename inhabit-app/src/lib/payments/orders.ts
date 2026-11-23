import { randomBytes } from 'crypto'
import type { Payload } from 'payload'
import type { Order } from '@/payload-types'
import { extendAccess } from '../bookAccess'
import type { SessionSummary } from './provider'

/** Référence lisible : INH-20261123-7F3K2Q */
export function newOrderReference() {
  const d = new Date()
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = randomBytes(4).toString('base64url').replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase()
  return `INH-${date}-${rand}`
}

async function findOrder(payload: Payload, s: SessionSummary): Promise<Order | null> {
  if (s.orderId) {
    const byId = await payload.findByID({ collection: 'orders', id: s.orderId, depth: 0, disableErrors: true })
    if (byId) return byId
  }
  const bySession = await payload.find({
    collection: 'orders',
    where: { providerSessionId: { equals: s.sessionId } },
    limit: 1,
    depth: 0,
  })
  return bySession.docs[0] ?? null
}

/**
 * Valide une commande payée. Peut être appelée plusieurs fois sans effet de bord
 * (webhook + page de retour) : une commande déjà « payée » n'est pas retraitée.
 */
export async function fulfillPaidSession(payload: Payload, s: SessionSummary): Promise<Order | null> {
  const order = await findOrder(payload, s)
  if (!order || !s.paid) return order
  if (order.status === 'payee') return order

  // 1. Compte membre : uniquement celui qui a passé la commande connecté.
  //    (Jamais « par email » : les emails des membres ne sont pas vérifiés.)
  const memberId = typeof order.member === 'object' ? order.member?.id : order.member
  const email = (order.email || s.email || '').toLowerCase() || null

  // 2. Marquer la commande payée (déclenche le reçu par email)
  const updated = await payload.update({
    collection: 'orders',
    id: order.id,
    depth: 0,
    data: {
      status: 'payee',
      paidAt: new Date().toISOString(),
      providerSessionId: s.sessionId,
      providerPaymentId: s.paymentId ?? undefined,
      email: email ?? undefined,
      customerName: order.customerName || s.customerName || undefined,
      shippingAddress: s.shipping || order.shippingAddress || undefined,
      member: memberId ?? undefined,
    },
  })

  // 3. Ouvrir la lecture en ligne (à vie, ou prolonger l'abonnement)
  if (updated.grantsBookAccess && memberId) {
    const member = await payload.findByID({ collection: 'members', id: memberId, depth: 0, disableErrors: true })
    if (member) {
      const lifetime = !updated.accessDays || (member.bookAccess && !member.bookAccessUntil)
      await payload.update({
        collection: 'members',
        id: memberId,
        depth: 0,
        data: {
          bookAccess: true,
          bookAccessUntil: lifetime ? null : extendAccess(member.bookAccessUntil, updated.accessDays as number),
        },
      })
    }
  }

  // 4. Accompagnement : réservation réglée
  const bookingId = typeof updated.coachingBooking === 'object' ? updated.coachingBooking?.id : updated.coachingBooking
  if (bookingId) {
    await payload.update({ collection: 'coaching-bookings', id: bookingId, data: { paymentStatus: 'payee' }, depth: 0 })
  }

  return updated
}

/** Paiement abandonné ou refusé : on garde une trace sans toucher aux commandes déjà payées. */
export async function markSessionClosed(payload: Payload, s: SessionSummary, status: 'expiree' | 'echouee') {
  const order = await findOrder(payload, s)
  if (!order || order.status !== 'en-attente') return
  await payload.update({ collection: 'orders', id: order.id, data: { status }, depth: 0 })
}
