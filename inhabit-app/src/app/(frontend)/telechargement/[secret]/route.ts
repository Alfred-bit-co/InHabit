import { getPayloadClient } from '@/lib/payload'
import { DOWNLOAD_MAX } from '@/lib/payments/config'
import { digitalBook } from '@/lib/payments/download'
import { findOrderBySecret } from '@/lib/payments/orders'

export const dynamic = 'force-dynamic'

const page = (title: string, text: string, status: number) =>
  new Response(
    `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font-family:'Century Gothic',Urbanist,Arial,sans-serif;background:#f3eee6;color:#1f1a15;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px"><main style="max-width:520px;background:#faf7f2;border-radius:28px;padding:40px"><h1 style="margin-top:0">${title}</h1><p>${text}</p><p><a href="/a-propos#contact" style="color:#a45428">Nous écrire</a></p></main></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  )

/** Téléchargement du livre numérique, réservé aux commandes payées. */
export async function GET(_: Request, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params
  const order = await findOrderBySecret(secret)
  if (!order || order.product !== 'livre-numerique' || !['payee', 'expediee'].includes(order.status)) {
    return page('Lien invalide', 'Ce lien de téléchargement n’existe pas ou la commande n’est pas encore payée.', 404)
  }
  if (order.downloadExpiresAt && new Date(order.downloadExpiresAt) < new Date()) {
    return page('Lien expiré', `Ce lien a expiré. Écrivez-nous en indiquant la référence ${order.reference} pour en recevoir un nouveau.`, 410)
  }
  if ((order.downloadCount ?? 0) >= DOWNLOAD_MAX) {
    return page('Limite atteinte', `Le nombre de téléchargements est atteint. Écrivez-nous avec la référence ${order.reference}.`, 429)
  }

  const payload = await getPayloadClient()
  // Le fichier est relu dans l'édition : si Warren remplace le PDF, l'acheteur reçoit la dernière version.
  const book = await payload.findGlobal({ slug: 'book', depth: 0 })
  const fileKey = (book.editions ?? []).find((e) => e.id === order.editionId)?.digitalFile
  if (!fileKey) return page('Fichier indisponible', `Le fichier est momentanément indisponible. Écrivez-nous avec la référence ${order.reference}.`, 503)

  try {
    const target = await digitalBook(fileKey)
    await payload.update({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
      data: { downloadCount: (order.downloadCount ?? 0) + 1 },
    })
    if (target.kind === 'redirect') return Response.redirect(target.url, 302)
    return new Response(new Uint8Array(target.body), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${target.filename.replace(/"/g, '')}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    payload.logger.error({ err, msg: `Téléchargement impossible (commande ${order.reference})` })
    return page('Fichier indisponible', `Le fichier est momentanément indisponible. Écrivez-nous avec la référence ${order.reference}.`, 503)
  }
}
