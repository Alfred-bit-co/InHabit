import type { Metadata } from 'next'
import Link from 'next/link'
import { AutoRefresh } from '@/components/AutoRefresh'
import { formatMonthFr } from '@/lib/dates'
import { formatEuros } from '@/lib/payments/config'
import { findOrderBySecret, markOrderPaid } from '@/lib/payments/orders'
import { stripe, stripeCustomer } from '@/lib/payments/stripe'

export const metadata: Metadata = { title: 'Merci pour votre commande', robots: { index: false, follow: false } }

type Props = { searchParams: Promise<{ k?: string; session_id?: string }> }

export default async function ThankYouPage({ searchParams }: Props) {
  const { k, session_id } = await searchParams
  let order = await findOrderBySecret(k)

  if (!order) {
    return (
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Commande</span>
          <h1>Commande introuvable.</h1>
          <p className="lead">Ce lien ne correspond à aucune commande. Si vous avez payé, vérifiez l’email de confirmation reçu.</p>
          <Link href="/a-propos#contact" className="btn btn-beige" style={{ marginTop: 16 }}>
            Nous écrire
          </Link>
        </div>
      </section>
    )
  }

  // Si Stripe a redirigé avant que son message (webhook) n'arrive, on vérifie directement.
  if (order.status === 'en-attente' && order.provider === 'stripe' && session_id && session_id === order.providerId) {
    try {
      const session = await stripe().checkout.sessions.retrieve(session_id)
      if (session.payment_status === 'paid') order = await markOrderPaid(order, stripeCustomer(session))
    } catch {
      // le webhook prendra le relais
    }
  }

  const paid = order.status === 'payee' || order.status === 'expediee'
  const first = (order.customerName || '').split(' ')[0]

  if (!paid) {
    const waiting = order.status === 'en-attente'
    return (
      <section className="page-hero">
        <div className="container">
          {waiting && <AutoRefresh />}
          <span className="eyebrow">Commande {order.reference}</span>
          <h1>{waiting ? 'Paiement en cours de confirmation…' : 'Paiement non finalisé.'}</h1>
          <p className="lead">
            {waiting
              ? 'Cela prend généralement quelques secondes. Cette page se met à jour toute seule.'
              : 'Aucun montant n’a été débité. Vous pouvez recommencer quand vous le souhaitez.'}
          </p>
          {!waiting && (
            <Link href={order.product === 'accompagnement' ? '/produits/accompagnement#reserver' : '/produits/livre-concept#editions'} className="btn btn-beige" style={{ marginTop: 16 }}>
              Recommencer
            </Link>
          )}
        </div>
      </section>
    )
  }

  const address = [
    order.shipping?.name,
    order.shipping?.line1,
    order.shipping?.line2,
    [order.shipping?.postalCode, order.shipping?.city].filter(Boolean).join(' '),
    order.shipping?.country,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Paiement confirmé</span>
          <h1>
            Merci{first ? ` ${first}` : ''}, c’est <em>confirmé</em>.
          </h1>
          <p className="lead">
            {order.product === 'livre-numerique' &&
              'Votre livre numérique est prêt. Le lien de téléchargement vous a aussi été envoyé par email.'}
            {order.product === 'livre-papier' && 'Votre commande est enregistrée. Vous recevrez un email au moment de l’expédition.'}
            {order.product === 'accompagnement' &&
              'Votre place est réservée. Vous recevrez par email les informations pratiques pour démarrer.'}
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="panel receipt">
            <dl>
              <dt>Référence</dt>
              <dd>{order.reference}</dd>
              <dt>Article</dt>
              <dd>{order.label}</dd>
              {order.month && (
                <>
                  <dt>Mois</dt>
                  <dd>{formatMonthFr(order.month)}</dd>
                </>
              )}
              <dt>Montant payé</dt>
              <dd>{formatEuros(order.amount)}</dd>
              <dt>Paiement</dt>
              <dd>{order.provider === 'paypal' ? 'PayPal' : 'Carte bancaire'}</dd>
              {order.product === 'livre-papier' && address && (
                <>
                  <dt>Livraison</dt>
                  <dd>{address}</dd>
                </>
              )}
            </dl>
            {order.product === 'livre-numerique' && (
              <a href={`/telechargement/${order.secret}`} className="btn btn-accent" style={{ justifySelf: 'start' }}>
                Télécharger le livre
              </a>
            )}
            <p className="form-note">
              Une question sur votre commande ? Écrivez-nous en indiquant la référence {order.reference}.
            </p>
          </div>
          <Link href="/" className="link-arrow" style={{ display: 'inline-block', marginTop: 28 }}>
            Retour à l’accueil
          </Link>
        </div>
      </section>
    </>
  )
}
