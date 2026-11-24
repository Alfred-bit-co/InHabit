import type { Metadata } from 'next'
import Link from 'next/link'
import { getMember } from '@/lib/member'
import { getPayloadClient } from '@/lib/payload'
import { formatMoney } from '@/lib/payments/money'
import { fulfillPaidSession } from '@/lib/payments/orders'
import { getPaymentProvider } from '@/lib/payments/provider'
import type { Order } from '@/payload-types'

export const metadata: Metadata = { title: 'Paiement', robots: { index: false } }

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams
  const provider = getPaymentProvider()
  let order: Order | null = null
  let paid = false

  if (provider && sessionId) {
    try {
      const payload = await getPayloadClient()
      const session = await provider.getSession(sessionId)
      paid = session.paid
      // Valide aussi la commande ici, au cas où la confirmation serveur (webhook) arrive en retard
      order = await fulfillPaidSession(payload, session)
    } catch (err) {
      console.error('[paiement] retour', err)
    }
  }

  const member = await getMember()
  const opensReading = Boolean(order?.grantsBookAccess)

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="panel pay-result">
          {paid && order ? (
            <>
              <span className="pay-result-icon ok" aria-hidden="true">✓</span>
              <span className="eyebrow">Paiement confirmé</span>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Merci pour votre achat.</h1>
              <p className="lead">
                {order.label} — <strong>{formatMoney(order.amount, order.currency)}</strong>
              </p>
              <p className="muted">
                Référence {order.reference}. Un reçu vient de vous être envoyé{order.email ? ` à ${order.email}` : ''}.
              </p>
              {order.shippingAddress && (
                <p className="muted" style={{ whiteSpace: 'pre-line' }}>
                  Livraison à :<br />
                  {order.shippingAddress}
                </p>
              )}
              <div className="pay-result-actions">
                {opensReading ? (
                  <Link href={member ? '/espace-membre' : '/espace-membre/connexion'} className="btn btn-accent">
                    Accéder à mon espace membre <span className="arrow">→</span>
                  </Link>
                ) : (
                  <Link href="/" className="btn btn-dark">
                    Retour à l’accueil <span className="arrow">→</span>
                  </Link>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="pay-result-icon" aria-hidden="true">…</span>
              <span className="eyebrow">Paiement</span>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Paiement en cours de vérification.</h1>
              <p className="lead">
                Si vous venez de payer, la confirmation peut prendre quelques instants. Vous recevrez un email dès
                qu’elle sera arrivée.
              </p>
              <div className="pay-result-actions">
                <Link href="/produits" className="btn btn-dark">
                  Retour aux produits <span className="arrow">→</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
