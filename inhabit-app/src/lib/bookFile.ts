import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { open } from 'fs/promises'
import path from 'path'
import type { BookFile, Member } from '@/payload-types'
import { hasBookAccess } from './bookAccess'
import { getPayloadClient } from './payload'
import { privateBucket, s3ClientConfig, s3Enabled } from './s3'

/* ───────────── Quel fichier pour ce membre ? ───────────── */

/** Le livre PDF en ligne le plus récent, seulement pour un membre abonné (accès payé et en cours). */
export async function getReadableBookFile(member: Member): Promise<BookFile | null> {
  if (!hasBookAccess(member)) return null
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'book-files',
    where: { and: [{ kind: { equals: 'complet' } }, { active: { equals: true } }] },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
}

export function canReadFile(member: Member, file: Pick<BookFile, 'kind' | 'active'>) {
  return Boolean(file.active) && file.kind === 'complet' && hasBookAccess(member)
}

/* ───────────── Jeton de lecture ───────────── */

const SECRET = () => process.env.PAYLOAD_SECRET || 'dev-secret'
const TOKEN_TTL = 12 * 60 * 60 * 1000 // 12 heures

const hmac = (value: string) => createHmac('sha256', SECRET()).update(value).digest()

/** Jeton signé lié au membre et au fichier, valable 12 h. */
export function createReaderToken(memberId: number, fileId: number) {
  const nonce = randomBytes(12).toString('base64url')
  const exp = Date.now() + TOKEN_TTL
  const body = `${memberId}.${fileId}.${exp}.${nonce}`
  return `${body}.${hmac(`reader:${body}`).toString('base64url')}`
}

export function verifyReaderToken(token: string, memberId: number) {
  const parts = token.split('.')
  if (parts.length !== 5) return null
  const [mid, fid, exp, nonce, sig] = parts
  const body = `${mid}.${fid}.${exp}.${nonce}`
  const expected = hmac(`reader:${body}`)
  const given = Buffer.from(sig, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  if (Number(mid) !== memberId || Number(exp) < Date.now()) return null
  return { fileId: Number(fid) }
}

/** Clé de brouillage des morceaux du PDF (32 octets), dérivée du jeton. */
export const readerKey = (token: string) => hmac(`key:${token}`)

/** Brouille / débrouille un morceau (même opération dans les deux sens). */
export function scramble(buf: Uint8Array, key: Uint8Array, offset: number) {
  for (let i = 0; i < buf.length; i++) buf[i] ^= key[(offset + i) % key.length]
  return buf
}

/* ───────────── Lecture d'un morceau du fichier ───────────── */

export const LOCAL_BOOK_DIR = path.resolve(process.cwd(), 'private-files/book')

let s3: S3Client | null = null

/** Lit les octets [start, end] (inclus) du PDF, dans le bucket privé ou sur le disque en local. */
export async function readFileRange(file: BookFile, start: number, end: number): Promise<Uint8Array> {
  if (!file.filename) throw new Error('Fichier sans nom')
  if (s3Enabled) {
    s3 ??= new S3Client(s3ClientConfig)
    const prefix = (file as { prefix?: string | null }).prefix
    const res = await s3.send(
      new GetObjectCommand({
        Bucket: privateBucket,
        Key: [prefix, file.filename].filter(Boolean).join('/'),
        Range: `bytes=${start}-${end}`,
      }),
    )
    if (!res.Body) throw new Error('Fichier introuvable')
    return new Uint8Array(await res.Body.transformToByteArray())
  }
  const safeName = path.basename(file.filename)
  const handle = await open(path.join(LOCAL_BOOK_DIR, safeName), 'r')
  try {
    const length = end - start + 1
    const buf = Buffer.alloc(length)
    const { bytesRead } = await handle.read(buf, 0, length, start)
    return new Uint8Array(buf.subarray(0, bytesRead))
  } finally {
    await handle.close()
  }
}
