import Stripe from 'stripe'
import { toMinorUnits } from './money'
import type { PaymentProvider, SessionSummary } from './provider'

/** Pays où un livre papier peut être livré (adresse demandée sur la page de paiement). */
const SHIPPING_COUNTRIES = [
  // Afrique de l'Ouest et centrale
  'BJ', 'TG', 'CI', 'SN', 'BF', 'ML', 'NE', 'GH', 'NG', 'CM', 'GA', 'CG', 'CD', 'GN',
  // Maghreb
  'MA', 'TN', 'DZ',
  // Europe
  'FR', 'BE', 'CH', 'LU', 'DE', 'ES', 'IT', 'PT', 'NL', 'GB', 'IE',
  // Amériques et Asie
  'CA', 'US', 'JP',
] as const

type Country = Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry

const formatShipping = (s: Stripe.Checkout.Session): string | null => {
  const d = s.collected_information?.shipping_details
  if (!d) return null
  const a = d.address
  return [d.name, a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(' '), a.state, a.country]
    .filter(Boolean)
    .join('\n')
}

const summarize = (s: Stripe.Checkout.Session): SessionSummary => ({
  sessionId: s.id,
  orderId: s.client_reference_id || s.metadata?.orderId || null,
  paid: s.payment_status === 'paid' || s.payment_status === 'no_payment_required',
  paymentId: typeof s.payment_intent === 'string' ? s.payment_intent : (s.payment_intent?.id ?? null),
  email: s.customer_details?.email ?? s.customer_email ?? null,
  customerName: s.customer_details?.name ?? null,
  shipping: formatShipping(s),
})

export function createStripeProvider(secretKey: string): PaymentProvider {
  const stripe = new Stripe(secretKey)

  return {
    id: 'stripe',
    label: 'Stripe',

    async createCheckout(req) {
      const session = await stripe.checkout.sessions.create(
        {
          mode: 'payment',
          // Pas de liste de moyens de paiement imposée : la carte bancaire est toujours proposée,
          // les autres (Apple Pay, Google Pay…) s'activent depuis le tableau de bord Stripe.
          locale: 'fr',
          client_reference_id: req.orderId,
          customer_email: req.email || undefined,
          metadata: { orderId: req.orderId, reference: req.reference },
          payment_intent_data: {
            description: `${req.name} — ${req.reference}`,
            metadata: { orderId: req.orderId, reference: req.reference },
          },
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: req.currency.toLowerCase(),
                unit_amount: toMinorUnits(req.amount, req.currency),
                product_data: {
                  name: req.name,
                  description: req.description || undefined,
                  images: req.imageUrl?.startsWith('https://') ? [req.imageUrl] : undefined,
                },
              },
            },
          ],
          shipping_address_collection: req.collectShipping
            ? { allowed_countries: [...SHIPPING_COUNTRIES] as Country[] }
            : undefined,
          success_url: req.successUrl,
          cancel_url: req.cancelUrl,
        },
        // Un double clic ne crée pas deux sessions pour la même commande
        { idempotencyKey: `checkout-${req.orderId}` },
      )
      if (!session.url) throw new Error('Stripe n’a pas renvoyé d’adresse de paiement.')
      return { sessionId: session.id, url: session.url }
    },

    async getSession(sessionId) {
      return summarize(await stripe.checkout.sessions.retrieve(sessionId))
    },

    async parseWebhook(rawBody, headers) {
      const secret = process.env.STRIPE_WEBHOOK_SECRET
      const signature = headers.get('stripe-signature')
      if (!secret || !signature) throw new Error('Webhook Stripe : secret ou signature manquant.')
      const event = await stripe.webhooks.constructEventAsync(rawBody, signature, secret)

      switch (event.type) {
        case 'checkout.session.completed':
        case 'checkout.session.async_payment_succeeded': {
          const s = summarize(event.data.object)
          // « completed » peut arriver avant l'encaissement (virement…) : on attend « paid ».
          return s.paid ? { type: 'paid', session: s } : { type: 'ignored' }
        }
        case 'checkout.session.async_payment_failed':
          return { type: 'failed', session: summarize(event.data.object) }
        case 'checkout.session.expired':
          return { type: 'expired', session: summarize(event.data.object) }
        default:
          return { type: 'ignored' }
      }
    },
  }
}
