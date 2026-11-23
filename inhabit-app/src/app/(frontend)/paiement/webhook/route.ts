import { getPayloadClient } from '@/lib/payload'
import { fulfillPaidSession, markSessionClosed } from '@/lib/payments/orders'
import { getPaymentProvider } from '@/lib/payments/provider'

export const dynamic = 'force-dynamic'

/**
 * Confirmation des paiements, appelée directement par le prestataire (Stripe).
 * Adresse à déclarer dans Stripe : https://<votre-site>/paiement/webhook
 * Événements : checkout.session.completed, checkout.session.async_payment_succeeded,
 *              checkout.session.async_payment_failed, checkout.session.expired
 */
export async function POST(request: Request) {
  const provider = getPaymentProvider()
  if (!provider) return new Response('Paiement non configuré', { status: 503 })

  let result
  try {
    result = await provider.parseWebhook(await request.text(), request.headers)
  } catch (err) {
    console.error('[paiement] webhook refusé', err)
    return new Response('Signature invalide', { status: 400 })
  }

  try {
    const payload = await getPayloadClient()
    if (result.type === 'paid') await fulfillPaidSession(payload, result.session)
    if (result.type === 'expired') await markSessionClosed(payload, result.session, 'expiree')
    if (result.type === 'failed') await markSessionClosed(payload, result.session, 'echouee')
  } catch (err) {
    console.error('[paiement] webhook : traitement impossible', err)
    // 500 : le prestataire renverra l'événement plus tard
    return new Response('Erreur', { status: 500 })
  }
  return Response.json({ received: true })
}
