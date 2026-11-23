import { getPayloadClient } from '@/lib/payload'
import { siteUrl } from '@/lib/payments/config'
import { fedapayResult, getFedaPayTransaction } from '@/lib/payments/fedapay'
import { cancelOrder, findOrderBySecret, markOrderPaid } from '@/lib/payments/orders'

export const dynamic = 'force-dynamic'

/**
 * Retour depuis la page FedaPay. Les paramètres ajoutés par FedaPay ne sont pas utilisés :
 * l'état réel de la transaction est redemandé à FedaPay avec la clé secrète.
 */
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get('k')
  const order = await findOrderBySecret(secret)
  const back = (path: string) => Response.redirect(`${siteUrl()}${path}`, 303)

  if (!order || order.provider !== 'fedapay' || !order.providerId) return back('/paiement/annule')

  if (order.status === 'en-attente' || order.status === 'annulee') {
    try {
      const result = await fedapayResult(await getFedaPayTransaction(order.providerId))
      if (result.completed) {
        await markOrderPaid(order, result)
      } else if (result.failed) {
        await cancelOrder(order, 'Paiement FedaPay refusé ou annulé.')
        return back(`/paiement/annule?k=${order.secret}&erreur=1`)
      }
      // Sinon (« pending ») : la page de remerciement attend la confirmation et se rafraîchit seule.
    } catch (err) {
      const payload = await getPayloadClient()
      payload.logger.error({ err, msg: `FedaPay : vérification impossible (commande ${order.reference})` })
    }
  }
  return back(`/paiement/merci?k=${order.secret}`)
}
