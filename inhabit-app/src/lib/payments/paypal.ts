import { siteUrl, toDecimal } from './config'
import type { CheckoutInput } from './orders'

/**
 * PayPal Checkout (API REST « Orders v2 »), sans bibliothèque supplémentaire.
 * PAYPAL_MODE=live pour les vrais paiements ; sinon le bac à sable (sandbox) est utilisé.
 * Le client est envoyé sur la page PayPal (compte PayPal ou carte sans compte),
 * puis revient sur /paiement/paypal/retour où le paiement est encaissé.
 */
const apiBase = () =>
  process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

let cached: { token: string; expires: number } | null = null

async function accessToken() {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')
  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`PayPal : authentification refusée (${res.status})`)
  const json = (await res.json()) as { access_token: string; expires_in: number }
  cached = { token: json.access_token, expires: Date.now() + json.expires_in * 1000 }
  return cached.token
}

async function call<T>(path: string, init: { method: 'GET' | 'POST'; body?: unknown; requestId?: string }) {
  const res = await fetch(`${apiBase()}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      'Content-Type': 'application/json',
      ...(init.requestId ? { 'PayPal-Request-Id': init.requestId } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as T & { name?: string; details?: { issue?: string }[] }
  return { ok: res.ok, status: res.status, json }
}

type PayPalAddress = {
  address_line_1?: string
  address_line_2?: string
  admin_area_1?: string
  admin_area_2?: string
  postal_code?: string
  country_code?: string
}

export type PayPalOrder = {
  id: string
  status: string
  links?: { href: string; rel: string }[]
  payer?: { email_address?: string; name?: { given_name?: string; surname?: string }; phone?: { phone_number?: { national_number?: string } } }
  purchase_units?: {
    custom_id?: string
    shipping?: { name?: { full_name?: string }; address?: PayPalAddress }
    payments?: { captures?: { id: string; status: string; amount: { value: string; currency_code: string } }[] }
  }[]
}

export async function createPayPalOrder(input: CheckoutInput) {
  const base = siteUrl()
  const isPaper = input.product === 'livre-papier'
  const item = toDecimal(input.price)
  const shipping = toDecimal(isPaper ? input.shippingFee : 0)
  const total = toDecimal(input.price + (isPaper ? input.shippingFee : 0))

  const { ok, status, json } = await call<PayPalOrder>('/v2/checkout/orders', {
    method: 'POST',
    requestId: `create-${input.secret}`,
    body: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: input.reference,
          custom_id: String(input.orderId),
          invoice_id: input.reference,
          description: input.label.slice(0, 127),
          amount: {
            currency_code: 'EUR',
            value: total,
            breakdown: { item_total: { currency_code: 'EUR', value: item }, shipping: { currency_code: 'EUR', value: shipping } },
          },
          items: [
            {
              name: input.label.slice(0, 127),
              quantity: '1',
              unit_amount: { currency_code: 'EUR', value: item },
              category: isPaper ? 'PHYSICAL_GOODS' : 'DIGITAL_GOODS',
            },
          ],
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'InHabit_Archi',
            user_action: 'PAY_NOW',
            shipping_preference: isPaper ? 'GET_FROM_FILE' : 'NO_SHIPPING',
            return_url: `${base}/paiement/paypal/retour?k=${input.secret}`,
            cancel_url: `${base}/paiement/annule?k=${input.secret}`,
          },
          ...(input.customerEmail ? { email_address: input.customerEmail } : {}),
        },
      },
    },
  })
  if (!ok) throw new Error(`PayPal : création de la commande refusée (${status} ${json.name ?? ''})`)
  const url = json.links?.find((l) => l.rel === 'payer-action' || l.rel === 'approve')?.href
  if (!url) throw new Error('PayPal n’a pas renvoyé d’adresse de paiement')
  return { url, providerId: json.id }
}

export async function getPayPalOrder(id: string) {
  const { ok, json } = await call<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(id)}`, { method: 'GET' })
  if (!ok) throw new Error('PayPal : commande introuvable')
  return json
}

/**
 * Encaisse le paiement approuvé par le client. Sans risque de double encaissement :
 * PayPal reconnaît la même demande grâce à « PayPal-Request-Id ».
 */
export async function capturePayPalOrder(id: string, secret: string) {
  const { ok, json } = await call<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(id)}/capture`, {
    method: 'POST',
    requestId: `capture-${secret}`,
    body: {},
  })
  if (ok) return json
  if (json.details?.some((d) => d.issue === 'ORDER_ALREADY_CAPTURED')) return getPayPalOrder(id)
  throw new Error(`PayPal : paiement non encaissé (${json.details?.[0]?.issue ?? json.name ?? 'erreur'})`)
}

/** Coordonnées, adresse et montant renvoyés par PayPal après l'encaissement. */
export function paypalCustomer(order: PayPalOrder) {
  const unit = order.purchase_units?.[0]
  const capture = unit?.payments?.captures?.[0]
  const addr = unit?.shipping?.address
  const name = [order.payer?.name?.given_name, order.payer?.name?.surname].filter(Boolean).join(' ')
  return {
    completed: order.status === 'COMPLETED' && capture?.status === 'COMPLETED',
    paymentId: capture?.id,
    amountPaid: capture ? Number(capture.amount.value) : 0,
    currency: capture?.amount.currency_code,
    customerName: name || unit?.shipping?.name?.full_name || undefined,
    customerEmail: order.payer?.email_address,
    customerPhone: order.payer?.phone?.phone_number?.national_number,
    shipping: addr
      ? {
          name: unit?.shipping?.name?.full_name || name || undefined,
          line1: addr.address_line_1,
          line2: addr.address_line_2,
          postalCode: addr.postal_code,
          city: addr.admin_area_2,
          state: addr.admin_area_1,
          country: addr.country_code,
        }
      : undefined,
  }
}
