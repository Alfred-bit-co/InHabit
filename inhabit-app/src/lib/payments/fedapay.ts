import { fromXof, siteUrl, toXof } from './config'
import type { CheckoutInput } from './orders'

/**
 * FedaPay (Afrique de l'Ouest) : Mobile Money (T-Money, Flooz, MTN, Orange, Wave…)
 * et carte Visa / Mastercard, en francs CFA. API REST, sans bibliothèque.
 * FEDAPAY_MODE=live pour les vrais paiements ; sinon le bac à sable (sandbox).
 *
 * Sécurité : le site ne croit jamais ce que dit le navigateur ou le message reçu ;
 * il redemande toujours l'état de la transaction à FedaPay avec la clé secrète.
 */
const apiBase = () =>
  process.env.FEDAPAY_MODE === 'live' ? 'https://api.fedapay.com/v1' : 'https://sandbox-api.fedapay.com/v1'

async function call<T>(path: string, method: 'GET' | 'POST', body?: unknown) {
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return { ok: res.ok, status: res.status, json }
}

/** FedaPay renvoie selon les versions l'objet seul ou enveloppé (« v1/transaction »). */
const unwrap = <T>(json: Record<string, unknown>, key: string) => ((json[key] as T) ?? (json as T))

export type FedaPayTransaction = {
  id: number
  reference?: string
  amount: number
  status: string
  customer_id?: number
  currency_id?: number
  mode?: string | null
}

type FedaPayCustomer = {
  firstname?: string
  lastname?: string
  email?: string
  phone_number?: { number?: string }
}

export async function createFedaPayCheckout(input: CheckoutInput) {
  const [firstname, ...rest] = (input.customerName || '').trim().split(/\s+/)
  const created = await call('/transactions', 'POST', {
    description: `${input.label} — ${input.reference}`.slice(0, 190),
    amount: toXof(input.price),
    currency: { iso: 'XOF' },
    callback_url: `${siteUrl()}/paiement/fedapay/retour?k=${input.secret}`,
    custom_metadata: { orderId: String(input.orderId), reference: input.reference },
    ...(input.customerEmail
      ? { customer: { email: input.customerEmail, firstname: firstname || undefined, lastname: rest.join(' ') || undefined } }
      : {}),
  })
  if (!created.ok) throw new Error(`FedaPay : création refusée (${created.status})`)
  const tx = unwrap<FedaPayTransaction>(created.json, 'v1/transaction')
  if (!tx?.id) throw new Error('FedaPay : transaction sans identifiant')

  const token = await call(`/transactions/${tx.id}/token`, 'POST')
  const url = (token.json as { url?: string }).url
  if (!token.ok || !url) throw new Error(`FedaPay : lien de paiement indisponible (${token.status})`)
  return { url, providerId: String(tx.id) }
}

export async function getFedaPayTransaction(id: string) {
  const { ok, json } = await call(`/transactions/${encodeURIComponent(id)}`, 'GET')
  if (!ok) throw new Error('FedaPay : transaction introuvable')
  return unwrap<FedaPayTransaction>(json, 'v1/transaction')
}

/** Coordonnées saisies par le client sur la page FedaPay (au mieux : sinon on garde celles du site). */
async function getCustomer(id?: number) {
  if (!id) return null
  try {
    const { ok, json } = await call(`/customers/${id}`, 'GET')
    return ok ? unwrap<FedaPayCustomer>(json, 'v1/customer') : null
  } catch {
    return null
  }
}

/** « approved » = payé ; « transferred » = payé puis reversé sur le compte du marchand. */
export const fedapayPaid = (status: string) => status === 'approved' || status === 'transferred'
export const fedapayFailed = (status: string) => ['declined', 'canceled', 'refunded', 'expired'].includes(status)

export async function fedapayResult(tx: FedaPayTransaction) {
  const customer = await getCustomer(tx.customer_id)
  const name = [customer?.firstname, customer?.lastname].filter(Boolean).join(' ')
  return {
    completed: fedapayPaid(tx.status),
    failed: fedapayFailed(tx.status),
    paymentId: tx.reference || String(tx.id),
    amountPaid: fromXof(tx.amount),
    customerName: name || undefined,
    customerEmail: customer?.email || undefined,
    customerPhone: customer?.phone_number?.number ? String(customer.phone_number.number) : undefined,
  }
}
