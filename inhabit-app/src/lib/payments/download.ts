import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { readFile } from 'fs/promises'
import path from 'path'

/**
 * Livres numériques : rangés dans un bucket Supabase PRIVÉ (« prive » par défaut),
 * jamais dans le bucket public des images. Le site crée un lien temporaire (10 minutes)
 * uniquement pour un acheteur dont la commande est payée.
 *
 * En local (sans variables S3_*), le fichier est lu dans le dossier private/ du projet.
 */
const s3Ready = () =>
  Boolean(process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY)

export const privateBucket = () => process.env.S3_PRIVATE_BUCKET || 'prive'

/** Nom de fichier sûr : pas de « ../ », pas de chemin absolu. */
export const safeKey = (key: string) =>
  key
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/')

let client: S3Client | null = null
const s3 = () =>
  (client ??= new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'eu-west-3',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  }))

export type DownloadTarget = { kind: 'redirect'; url: string } | { kind: 'file'; body: Buffer; filename: string }

export async function digitalBook(key: string): Promise<DownloadTarget> {
  const clean = safeKey(key)
  const filename = path.basename(clean)
  if (s3Ready()) {
    const url = await getSignedUrl(
      s3(),
      new GetObjectCommand({
        Bucket: privateBucket(),
        Key: clean,
        ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, '')}"`,
      }),
      { expiresIn: 600 },
    )
    return { kind: 'redirect', url }
  }
  const body = await readFile(path.resolve(process.cwd(), 'private', clean))
  return { kind: 'file', body, filename }
}
