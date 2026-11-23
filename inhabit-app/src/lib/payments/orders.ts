import type { Where } from 'payload'
import type { Order } from '@/payload-types'
import { getPayloadClient, mediaUrl } from '@/lib/payload'
import {
  DOWNLOAD_DAYS,
  HOLD_MINUTES,
  newReference,
  newSecret,
  type Provider,
  providerLabel,
  providerSupportsShipping,
  siteUrl,
} from './config'
import { createFedaPayCheckout } from './fedapay'
import { createPayPalOrder } from './paypal'
import { createStripeCheckout } from './stripe'

export type Product = 'livre-papier' | 'livre-numerique' | 'accompagnement'

/** Tout ce qu'il faut pour ouvrir une page de paiement Stripe ou PayPal. */
export type CheckoutInput = {
  orderId: number
  reference: string
  secret: string
  product: Product
  label: string
  price: number
  shippingFee: number
  shippingCountries: string[]
  deliveryNote?: string | null
  customerEmail?: string
  customerName?: string
  imageUrl?: string
}

export class CheckoutError extends Error {}

const absolute = (url: string | null) => {
  if (!url) return undefined
  const full = url.startsWith('/') ? `${siteUrl()}${url}` : url
  return full.startsWith('https://') ? full : undefined
}

/** Une édition du livre vendable en ligne, lue en base (le prix ne vient jamais du navigateur). */
export async function getSellableEdition(editionId: string) {
  const payload = await getPayloadClient()
  const book = await payload.findGlobal({ slug: 'book', depth: 1 })
  const ed = (book.editions ?? []).find((e) => e.id === editionId)
  if (!ed || !ed.sellOnline || ed.available === false || !ed.amount || ed.amount <= 0) return null
  const kind = ed.kind === 'numerique' ? 'numerique' : 'papier'
  if (kind === 'numerique' && !ed.digitalFile) return null
  const countries = String(book.shop?.shippingCountries || '')
    .split(/[\s,;]+/)
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c))
  return {
    editionId,
    product: (kind === 'numerique' ? 'livre-numerique' : 'livre-papier') as Product,
    label: `${book.title || 'CONCEPT'} — ${ed.name}${ed.format ? ` (${ed.format})` : ''}`,
    price: ed.amount,
    shippingFee: kind === 'papier' ? Math.max(0, book.shop?.shippingFee ?? 0) : 0,
    shippingCountries: countries.length ? countries : ['FR'],
    deliveryNote: book.shop?.deliveryNote,
    imageUrl: absolute(mediaUrl(ed.cover ?? book.cover, 'card')),
    digitalFile: ed.digitalFile ?? null,
  }
}

type StartArgs = {
  provider: Provider
  product: Product
  label: string
  price: number
  shippingFee?: number
  shippingCountries?: string[]
  deliveryNote?: string | null
  imageUrl?: string
  editionId?: string
  month?: string
  coachingBookingId?: number
  customer?: { name?: string; email?: string; phone?: string }
}

/**
 * Crée la commande « en attente » puis la page de paiement chez Stripe ou PayPal.
 * Renvoie l'adresse vers laquelle envoyer le client.
 */
export async function startCheckout(args: StartArgs): Promise<string> {
  if (args.product === 'livre-papier' && !providerSupportsShipping(args.provider)) {
    throw new CheckoutError('Ce moyen de paiement n’est pas disponible pour le livre papier (adresse de livraison).')
  }
  const payload = await getPayloadClient()
  const shippingFee = args.product === 'livre-papier' ? (args.shippingFee ?? 0) : 0
  const order = await payload.create({
    collection: 'orders',
    overrideAccess: true,
    data: {
      reference: newReference(),
      secret: newSecret(),
      product: args.product,
      label: args.label,
      amount: Math.round((args.price + shippingFee) * 100) / 100,
      shippingFee: args.product === 'livre-papier' ? shippingFee : undefined,
      provider: args.provider,
      editionId: args.editionId,
      month: args.month,
      coachingBooking: args.coachingBookingId,
      customerName: args.customer?.name,
      customerEmail: args.customer?.email,
      customerPhone: args.customer?.phone,
      status: 'en-attente',
    },
  })

  const input: CheckoutInput = {
    orderId: order.id,
    reference: order.reference,
    secret: order.secret,
    product: args.product,
    label: args.label,
    price: args.price,
    shippingFee,
    shippingCountries: args.shippingCountries ?? [],
    deliveryNote: args.deliveryNote,
    customerEmail: args.customer?.email,
    customerName: args.customer?.name,
    imageUrl: args.imageUrl,
  }

  try {
    const session =
      args.provider === 'stripe'
        ? await createStripeCheckout(input)
        : args.provider === 'paypal'
          ? await createPayPalOrder(input)
          : await createFedaPayCheckout(input)
    await payload.update({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
      data: { providerId: session.providerId },
    })
    return session.url
  } catch (err) {
    payload.logger.error({ err, msg: `Paiement ${args.provider} impossible à ouvrir (commande ${order.reference})` })
    await cancelOrder(order, 'Page de paiement impossible à ouvrir')
    throw new CheckoutError('Le paiement n’a pas pu démarrer. Réessayez dans un instant ou choisissez un autre moyen de paiement.')
  }
}

export async function findOrderBySecret(secret: string | undefined | null) {
  if (!secret || !/^[a-f0-9]{48}$/.test(secret)) return null
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'orders',
    where: { secret: { equals: secret } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0] ?? null
}

export async function findOrderBy(field: 'providerId' | 'paymentId', value: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'orders',
    where: { [field]: { equals: value } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0] ?? null
}

type PaidDetails = {
  paymentId?: string
  amountPaid: number
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  shipping?: Order['shipping']
}

const DONE = new Set(['payee', 'expediee', 'remboursee'])

/**
 * Enregistre un paiement réussi. Appelée par le webhook Stripe, la page de remerciement
 * ou le retour PayPal : si la commande est déjà payée, elle ne fait rien.
 */
export async function markOrderPaid(order: Order, details: PaidDetails) {
  if (DONE.has(order.status)) return order
  const payload = await getPayloadClient()

  if (details.amountPaid + 0.01 < order.amount) {
    payload.logger.error(`Commande ${order.reference} : montant reçu ${details.amountPaid} € au lieu de ${order.amount} €`)
    await payload.update({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
      data: {
        note: `Montant reçu (${details.amountPaid.toFixed(2)} €) inférieur au prix (${order.amount} €) : à vérifier chez ${providerLabel(order.provider)}.`,
      },
    })
    return order
  }

  const lateNote =
    order.status === 'annulee' && order.product === 'accompagnement'
      ? 'Paiement reçu après l’expiration de la réservation : vérifiez qu’il reste bien une place.'
      : undefined
  const clean = <T extends object>(o: T) =>
    Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '')) as Partial<T>

  const updated = await payload.update({
    collection: 'orders',
    id: order.id,
    overrideAccess: true,
    data: {
      ...clean({
        paymentId: details.paymentId,
        customerName: details.customerName || order.customerName,
        customerEmail: details.customerEmail || order.customerEmail,
        customerPhone: details.customerPhone || order.customerPhone,
      }),
      ...(details.shipping ? { shipping: clean(details.shipping) } : {}),
      ...(order.product === 'livre-numerique'
        ? { downloadCount: 0, downloadExpiresAt: new Date(Date.now() + DOWNLOAD_DAYS * 86_400_000).toISOString() }
        : {}),
      ...(lateNote ? { note: [order.note, lateNote].filter(Boolean).join('\n') } : {}),
      paidAt: new Date().toISOString(),
      status: 'payee',
    },
  })

  const bookingId = typeof order.coachingBooking === 'object' ? order.coachingBooking?.id : order.coachingBooking
  if (bookingId) {
    await payload.update({
      collection: 'coaching-bookings',
      id: bookingId,
      overrideAccess: true,
      data: { status: 'confirmee', ...(lateNote ? { note: lateNote } : {}) },
    })
  }
  return updated
}

/** Paiement abandonné ou expiré : la commande passe en « Annulée » et la place est libérée. */
export async function cancelOrder(order: Order, reason?: string) {
  if (order.status !== 'en-attente') return
  const payload = await getPayloadClient()
  await payload.update({
    collection: 'orders',
    id: order.id,
    overrideAccess: true,
    data: { status: 'annulee', ...(reason ? { note: [order.note, reason].filter(Boolean).join('\n') } : {}) },
  })
  const bookingId = typeof order.coachingBooking === 'object' ? order.coachingBooking?.id : order.coachingBooking
  if (bookingId) {
    const booking = await payload.findByID({ collection: 'coaching-bookings', id: bookingId, depth: 0, overrideAccess: true })
    if (booking.status === 'attente-paiement') {
      await payload.update({
        collection: 'coaching-bookings',
        id: bookingId,
        overrideAccess: true,
        data: { status: 'annulee', note: 'Paiement non finalisé : place libérée automatiquement.' },
      })
    }
  }
}

/** Limite à partir de laquelle une réservation non payée ne bloque plus la place. */
export const holdCutoff = (now = Date.now()) => new Date(now - HOLD_MINUTES * 60_000).toISOString()

/**
 * Condition « réservation qui occupe une place » : confirmée, à traiter,
 * ou en attente de paiement depuis moins de 35 minutes.
 */
export const activeBookingWhere = (): Where => ({
  or: [
    { status: { in: ['nouvelle', 'confirmee'] } },
    { and: [{ status: { equals: 'attente-paiement' } }, { createdAt: { greater_than: holdCutoff() } }] },
  ],
})

/** Range les réservations restées sans paiement (les places sont déjà libérées par activeBookingWhere). */
export async function releaseStaleHolds() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'orders',
    where: { and: [{ status: { equals: 'en-attente' } }, { createdAt: { less_than: holdCutoff() } }] },
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  for (const order of docs) await cancelOrder(order, 'Paiement non finalisé dans le temps imparti.')
}
