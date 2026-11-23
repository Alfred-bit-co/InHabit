import { randomBytes } from 'crypto'

/**
 * Réglages communs aux paiements.
 * Les clés vivent uniquement dans les variables d'environnement (Vercel / .env local).
 * Tant qu'elles ne sont pas définies, les boutons de paiement n'apparaissent pas
 * et le site fonctionne comme avant.
 */

export const CURRENCY = 'EUR'

/** Durée pendant laquelle une place d'accompagnement reste bloquée le temps du paiement. */
export const HOLD_MINUTES = 35

/** Le lien de téléchargement du livre numérique reste valable 30 jours, 10 téléchargements. */
export const DOWNLOAD_DAYS = 30
export const DOWNLOAD_MAX = 10

export const stripeEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY)
export const paypalEnabled = () => Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
export const fedapayEnabled = () => Boolean(process.env.FEDAPAY_SECRET_KEY)

export type Provider = 'stripe' | 'paypal' | 'fedapay'

export const enabledProviders = (): Provider[] => [
  ...(stripeEnabled() ? (['stripe'] as const) : []),
  ...(paypalEnabled() ? (['paypal'] as const) : []),
  ...(fedapayEnabled() ? (['fedapay'] as const) : []),
]

/** FedaPay ne gère pas d'adresse de livraison : il est proposé pour le PDF et l'accompagnement. */
export const providerSupportsShipping = (p: Provider) => p !== 'fedapay'

export const providerLabel = (p?: string | null) =>
  p === 'paypal' ? 'PayPal' : p === 'fedapay' ? 'Mobile Money / carte (FedaPay)' : 'Carte bancaire (Stripe)'

/** Parité fixe euro / franc CFA (BCEAO) : 1 € = 655,957 FCFA. */
export const XOF_PER_EUR = 655.957
export const toXof = (euros: number) => Math.round(euros * XOF_PER_EUR)
export const fromXof = (xof: number) => xof / XOF_PER_EUR
export const formatXof = (euros?: number | null) =>
  typeof euros === 'number' ? `${new Intl.NumberFormat('fr-FR').format(toXof(euros))} FCFA` : ''

export const siteUrl = () => (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

/** 29 → « 29 € », 29.5 → « 29,50 € » */
export const formatEuros = (value?: number | null) =>
  typeof value === 'number'
    ? new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: CURRENCY,
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      }).format(value)
    : ''

/** Montant en euros → centimes (Stripe), arrondi pour éviter 28.999… */
export const toCents = (euros: number) => Math.round(euros * 100)

/** Montant en euros → « 29.00 » (PayPal) */
export const toDecimal = (euros: number) => (Math.round(euros * 100) / 100).toFixed(2)

/** Clé longue et imprévisible, utilisée dans les liens envoyés au client. */
export const newSecret = () => randomBytes(24).toString('hex')

/** Référence lisible : IH-2611-7K4QX */
export function newReference(now = new Date()) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(5)
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  return `IH-${yy}${mm}-${code}`
}
