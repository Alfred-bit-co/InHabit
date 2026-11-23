import { getPayloadClient } from '@/lib/payload'
import { fedapayResult, getFedaPayTransaction } from '@/lib/payments/fedapay'
import { cancelOrder, findOrderBy, markOrderPaid } from '@/lib/payments/orders'

export const dynamic = 'force-dynamic'

/**
 * FedaPay prévient le site ici quand une transaction change d'état
 * (à déclarer dans FedaPay : Webhooks → https://in-habit.vercel.app/webhooks/fedapay).
 * Le contenu du message n'est pas cru tel quel : seul l'identifiant sert à
 * redemander l'état réel de la transaction à FedaPay avec la clé secrète.
 */
export async function POST(req: Request) {
  if (!process.env.FEDAPAY_SECRET_KEY) return new Response('FedaPay non configuré', { status: 400 })

  type Ref = { id?: number | string }
  const body = (await req.json().catch(() => null)) as { entity?: Ref; object?: Ref; data?: Ref } | null
  const id = body?.entity?.id ?? body?.object?.id ?? body?.data?.id
  if (!id || !/^\d+$/.test(String(id))) return Response.json({ received: true })

  try {
    const order = await findOrderBy('providerId', String(id))
    if (!order || order.provider !== 'fedapay') return Response.json({ received: true })
    const result = await fedapayResult(await getFedaPayTransaction(String(id)))
    if (result.completed) await markOrderPaid(order, result)
    else if (result.failed) await cancelOrder(order, 'Paiement FedaPay refusé ou annulé.')
  } catch (err) {
    const payload = await getPayloadClient()
    payload.logger.error({ err, msg: `Webhook FedaPay : traitement impossible (transaction ${id})` })
    return new Response('Erreur', { status: 500 })
  }
  return Response.json({ received: true })
}
