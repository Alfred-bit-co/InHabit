import type { Metadata } from 'next'
import Link from 'next/link'
import { cancelOrder, findOrderBySecret } from '@/lib/payments/orders'
import { stripe } from '@/lib/payments/stripe'

export const metadata: Metadata = { title: 'Paiement annulé', robots: { index: false, follow: false } }

type Props = { searchParams: Promise<{ k?: string; erreur?: string }> }

export default async function CancelPage({ searchParams }: Props) {
  const { k, erreur } = await searchParams
  const order = await findOrderBySecret(k)

  // Le client a quitté la page de paiement : on ferme la session Stripe et on libère la place.
  if (order?.status === 'en-attente') {
    if (order.provider === 'stripe' && order.providerId) {
      await stripe()
        .checkout.sessions.expire(order.providerId)
        .catch(() => undefined)
    }
    await cancelOrder(order, erreur ? 'Paiement refusé ou interrompu.' : 'Paiement annulé par le client.')
  }

  const back =
    order?.product === 'accompagnement' ? '/produits/accompagnement#reserver' : '/produits/livre-concept#editions'

  return (
    <section className="page-hero">
      <div className="container">
        <span className="eyebrow">{order ? `Commande ${order.reference}` : 'Paiement'}</span>
        <h1>{erreur ? 'Le paiement n’a pas abouti.' : 'Paiement annulé.'}</h1>
        <p className="lead">
          Aucun montant n’a été débité.{' '}
          {order?.product === 'accompagnement'
            ? 'La place n’a pas été réservée : vous pouvez recommencer quand vous le souhaitez.'
            : 'Vous pouvez recommencer quand vous le souhaitez, ou choisir un autre moyen de paiement.'}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <Link href={back} className="btn btn-accent">
            Recommencer
          </Link>
          <Link href="/a-propos#contact" className="btn btn-beige">
            Nous écrire
          </Link>
        </div>
      </div>
    </section>
  )
}
