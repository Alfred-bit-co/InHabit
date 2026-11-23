import Stripe from 'stripe'
import { siteUrl, toCents } from './config'
import type { CheckoutInput } from './orders'

let client: Stripe | null = null

/** Client Stripe (clé secrète uniquement côté serveur). */
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY manquante')
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY)
  return client
}

/**
 * Page de paiement hébergée par Stripe (carte bancaire, Apple Pay, Google Pay…).
 * Aucune donnée de carte ne passe par le site.
 */
export async function createStripeCheckout(input: CheckoutInput) {
  const base = siteUrl()
  const isPaper = input.product === 'livre-papier'
  const isDigital = input.product === 'livre-numerique'

  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    locale: 'auto',
    client_reference_id: String(input.orderId),
    metadata: { orderId: String(input.orderId), reference: input.reference },
    payment_intent_data: {
      description: `${input.label} — ${input.reference}`,
      metadata: { orderId: String(input.orderId), reference: input.reference },
    },
    customer_email: input.customerEmail || undefined,
    customer_creation: 'if_required',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: toCents(input.price),
          product_data: { name: input.label, ...(input.imageUrl ? { images: [input.imageUrl] } : {}) },
        },
      },
    ],
    ...(isPaper
      ? {
          shipping_address_collection: {
            allowed_countries: input.shippingCountries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
          },
          phone_number_collection: { enabled: true },
          shipping_options: [
            {
              shipping_rate_data: {
                display_name: input.deliveryNote || 'Livraison',
                type: 'fixed_amount',
                fixed_amount: { amount: toCents(input.shippingFee), currency: 'eur' },
              },
            },
          ],
        }
      : {}),
    ...(isDigital
      ? {
          custom_text: {
            submit: {
              message:
                'Le PDF est disponible immédiatement après le paiement. En payant, vous demandez cet accès immédiat et renoncez au délai de rétractation de 14 jours.',
            },
          },
        }
      : {}),
    // La place d'accompagnement n'est bloquée que pendant 30 minutes (minimum imposé par Stripe)
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    success_url: `${base}/paiement/merci?k=${input.secret}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/paiement/annule?k=${input.secret}`,
  })

  if (!session.url) throw new Error('Stripe n’a pas renvoyé d’adresse de paiement')
  return { url: session.url, providerId: session.id }
}

/** Coordonnées et adresse renvoyées par Stripe après le paiement. */
export function stripeCustomer(session: Stripe.Checkout.Session) {
  const details = session.customer_details
  const shipping = session.collected_information?.shipping_details
  const addr = shipping?.address ?? null
  return {
    customerName: details?.name || shipping?.name || undefined,
    customerEmail: details?.email || undefined,
    customerPhone: details?.phone || undefined,
    shipping: addr
      ? {
          name: shipping?.name || details?.name || undefined,
          line1: addr.line1 || undefined,
          line2: addr.line2 || undefined,
          postalCode: addr.postal_code || undefined,
          city: addr.city || undefined,
          state: addr.state || undefined,
          country: addr.country || undefined,
        }
      : undefined,
    paymentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
    amountPaid: (session.amount_total ?? 0) / 100,
  }
}
