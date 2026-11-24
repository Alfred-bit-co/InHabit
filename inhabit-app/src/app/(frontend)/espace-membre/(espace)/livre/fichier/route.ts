import { canReadFile, readerKey, readFileRange, scramble, verifyReaderToken } from '@/lib/bookFile'
import { getSubscriber } from '@/lib/member'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/** Taille maximale d'un morceau : le fichier entier n'est jamais envoyé d'un coup. */
const MAX_CHUNK = 512 * 1024

const deny = (status: number, msg: string) =>
  new Response(msg, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })

/**
 * Morceaux brouillés du livre PDF, pour la liseuse uniquement.
 * Refuse : visiteur non connecté, membre sans accès, jeton absent/expiré,
 * ouverture directe dans un onglet, demande sans plage d'octets ou trop grande.
 */
export async function GET(request: Request) {
  const member = await getSubscriber()
  if (!member) return deny(401, 'Abonnement requis')

  // Uniquement depuis la liseuse (fetch), jamais en ouvrant l'adresse dans un onglet
  const dest = request.headers.get('sec-fetch-dest')
  if (dest && dest !== 'empty') return deny(403, 'Accès réservé à la liseuse')

  const token = request.headers.get('x-inhabit-reader') || ''
  const verified = verifyReaderToken(token, member.id)
  if (!verified) return deny(403, 'Session de lecture expirée : rechargez la page')

  const payload = await getPayloadClient()
  const file = await payload.findByID({ collection: 'book-files', id: verified.fileId, depth: 0, disableErrors: true })
  if (!file || !file.filesize || !canReadFile(member, file)) return deny(403, 'Accès non autorisé')

  const match = /^bytes=(\d+)-(\d+)$/.exec(request.headers.get('range') || '')
  if (!match) return deny(416, 'Plage requise')
  const start = Number(match[1])
  const end = Math.min(Number(match[2]), file.filesize - 1, start + MAX_CHUNK - 1)
  if (start > end) return deny(416, 'Plage invalide')

  try {
    const chunk = scramble(await readFileRange(file, start, end), readerKey(token), start)
    return new Response(Buffer.from(chunk), {
      status: 206,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Range': `bytes ${start}-${start + chunk.length - 1}/${file.filesize}`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Robots-Tag': 'noindex',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[livre] lecture du fichier', err)
    return deny(500, 'Lecture impossible')
  }
}
