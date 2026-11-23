import type Stripe from 'stripe'
import { getPayloadClient } from '@/lib/payload'
import { cancelOrder, findOrderBy, markOrderPaid } from '@/lib/payments/orders'
import { stripe, stripeCustomer } from '@/lib/payments/stripe'

export const dynamic = 'force-dynamic'

/**
 * Stripe prévient le site ici quand un paiement réussit, expire ou est remboursé.
 * À déclarer dans Stripe : Développeurs → Webhooks → https://in-habit.vercel.app/webhooks/stripe
 * La signature (STRIPE_WEBHOOK_SECRET) garantit que le message vient bien de Stripe.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = req.headers.get('stripe-signature')
  if (!secret || !signature) return new Response('Webhook non configuré', { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, secret)
  } catch {
    return new Response('Signature invalide', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object
        if (session.payment_status !== 'paid') break
        const order = await findOrderBy('providerId', session.id)
        if (order) await markOrderPaid(order, stripeCustomer(session))
        break
      }
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        const order = await findOrderBy('providerId', event.data.object.id)
        if (order) await cancelOrder(order, 'Paiement Stripe non finalisé.')
        break
      }
      case 'charge.refunded': {
        const charge = event.data.object
        const intent = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
        if (!intent || !charge.refunded) break // remboursement partiel : on laisse Warren décider
        const order = await findOrderBy('paymentId', intent)
        if (order && order.status !== 'remboursee') {
          const payload = await getPayloadClient()
          await payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { status: 'remboursee' } })
        }
        break
      }
    }
  } catch (err) {
    const payload = await getPayloadClient()
    payload.logger.error({ err, msg: `Webhook Stripe ${event.type} : traitement impossible` })
    // 500 : Stripe renverra le message plus tard
    return new Response('Erreur', { status: 500 })
  }

  return Response.json({ received: true })
}
