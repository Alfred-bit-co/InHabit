/**
 * Réglages communs du stockage Supabase (API compatible S3).
 * - S3_BUCKET : bucket PUBLIC des images du site.
 * - S3_PRIVATE_BUCKET : bucket PRIVÉ du livre en PDF (par défaut « livres »).
 */
export const s3Enabled = Boolean(
  process.env.S3_BUCKET && process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY,
)

export const privateBucket = process.env.S3_PRIVATE_BUCKET || 'livres'

/** Taille maximale d'un fichier : 50 Mo, plafond de l'offre gratuite de Supabase. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

export const s3ClientConfig = {
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'eu-west-3',
  forcePathStyle: true,
  /*
   * Contrôles d'intégrité « uniquement si exigés ». Par défaut, le SDK AWS ajoute aux adresses
   * d'envoi signées l'empreinte CRC32 d'un fichier VIDE (x-amz-checksum-crc32=AAAAAA==) :
   * le PDF envoyé depuis le navigateur ne correspond jamais et le stockage refuse l'envoi.
   * Réglage recommandé pour les stockages « compatibles S3 » comme Supabase.
   */
  requestChecksumCalculation: 'WHEN_REQUIRED' as const,
  responseChecksumValidation: 'WHEN_REQUIRED' as const,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
}
