/**
 * Paiement en ligne — couche indépendante du prestataire.
 *
 * Le site ne manipule JAMAIS de numéro de carte : le visiteur est redirigé vers
 * la page de paiement sécurisée du prestataire (Stripe Checkout aujourd'hui),
 * puis revient sur /paiement/merci. La confirmation fiable arrive ensuite par
 * « webhook » (appel serveur à serveur) sur /paiement/webhook.
 *
 * Pour changer de prestataire plus tard (ex. FedaPay, CinetPay, PayPal),
 * il suffit d'écrire un autre objet qui respecte `PaymentProvider`.
 */
import { createStripeProvider } from './stripe'

export type CheckoutRequest = {
  orderId: string
  reference: string
  name: string
  description?: string
  /** Montant en unités « normales » (29 pour 29 €, 15000 pour 15 000 FCFA). */
  amount: number
  currency: string
  imageUrl?: string | null
  email?: string | null
  collectShipping?: boolean
  successUrl: string
  cancelUrl: string
}

export type CheckoutSession = { sessionId: string; url: string }

/** Résumé d'une session de paiement, quel que soit le prestataire. */
export type SessionSummary = {
  sessionId: string
  orderId: string | null
  paid: boolean
  paymentId?: string | null
  email?: string | null
  customerName?: string | null
  shipping?: string | null
}

export type WebhookResult =
  | { type: 'paid'; session: SessionSummary }
  | { type: 'expired'; session: SessionSummary }
  | { type: 'failed'; session: SessionSummary }
  | { type: 'ignored' }

export interface PaymentProvider {
  id: 'stripe'
  label: string
  createCheckout(req: CheckoutRequest): Promise<CheckoutSession>
  getSession(sessionId: string): Promise<SessionSummary>
  /** Vérifie la signature et traduit l'événement. Lève une erreur si la signature est fausse. */
  parseWebhook(rawBody: string, headers: Headers): Promise<WebhookResult>
}

/** Prestataire actif, ou null si le paiement en ligne n'est pas encore configuré. */
export function getPaymentProvider(): PaymentProvider | null {
  if (process.env.STRIPE_SECRET_KEY) return createStripeProvider(process.env.STRIPE_SECRET_KEY)
  return null
}

/** Le paiement par carte est-il activé (clés présentes) ? */
export const paymentsEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY)

/** Adresse publique du site, pour les URL de retour. */
export const siteUrl = () => (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
