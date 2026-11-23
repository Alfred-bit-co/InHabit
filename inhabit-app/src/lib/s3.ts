/**
 * Réglages communs du stockage Supabase (API compatible S3).
 * - S3_BUCKET : bucket PUBLIC des images du site.
 * - S3_PRIVATE_BUCKET : bucket PRIVÉ du livre en PDF (par défaut « livres »).
 */
export const s3Enabled = Boolean(
  process.env.S3_BUCKET && process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY,
)

export const privateBucket = process.env.S3_PRIVATE_BUCKET || 'livres'

export const s3ClientConfig = {
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'eu-west-3',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
}
