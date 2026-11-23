import { getPayloadClient } from '@/lib/payload'
import { siteUrl } from '@/lib/payments/config'
import { findOrderBySecret, markOrderPaid } from '@/lib/payments/orders'
import { capturePayPalOrder, paypalCustomer } from '@/lib/payments/paypal'

export const dynamic = 'force-dynamic'

/**
 * Retour depuis PayPal après accord du client : le paiement est encaissé ici,
 * puis le client est envoyé sur la page de remerciement.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const secret = url.searchParams.get('k')
  const token = url.searchParams.get('token') // identifiant de la commande PayPal
  const order = await findOrderBySecret(secret)
  const back = (path: string) => Response.redirect(`${siteUrl()}${path}`, 303)

  if (!order || order.provider !== 'paypal' || !order.providerId) return back('/paiement/annule')
  if (token && token !== order.providerId) return back(`/paiement/annule?k=${order.secret}`)

  if (order.status === 'en-attente' || order.status === 'annulee') {
    try {
      const captured = paypalCustomer(await capturePayPalOrder(order.providerId, order.secret))
      if (captured.completed && captured.currency === 'EUR') {
        await markOrderPaid(order, captured)
      }
    } catch (err) {
      const payload = await getPayloadClient()
      payload.logger.error({ err, msg: `PayPal : encaissement impossible (commande ${order.reference})` })
      return back(`/paiement/annule?k=${order.secret}&erreur=1`)
    }
  }
  return back(`/paiement/merci?k=${order.secret}`)
}
