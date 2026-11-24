import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { fr } from '@payloadcms/translations/languages/fr'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { BookChapters } from './collections/BookChapters'
import { BookFiles } from './collections/BookFiles'
import { Events } from './collections/Events'
import { Members } from './collections/Members'
import { Orders } from './collections/Orders'
import { migrations } from './migrations'
import { Media } from './collections/Media'
import { News } from './collections/News'
import { Projects } from './collections/Projects'
import { Publications } from './collections/Publications'
import { Appointments, CoachingBookings, ContactMessages, TopicSuggestions } from './collections/Requests'
import { Users } from './collections/Users'
import { Videos, VideoThemes } from './collections/Videos'
import { MAX_UPLOAD_BYTES, privateBucket, s3ClientConfig, s3Enabled } from './lib/s3'
import { AboutPage, AppointmentSettings, Book, Coaching, HomePage, SiteSettings, YoutubePage } from './globals'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const databaseUrl = process.env.DATABASE_URL || 'file:./inhabit.db'

/**
 * PostgreSQL en production (DATABASE_URL=postgres://…, Supabase), SQLite en local.
 *
 * Avec Postgres :
 * - les tables vivent dans le schéma « payload », que l'API publique de Supabase
 *   n'expose pas (personne ne peut les lire avec la clé publique) ;
 * - le schéma n'est jamais modifié automatiquement (push: false) : il évolue
 *   uniquement par les migrations de src/migrations ;
 * - en production, les migrations en attente s'appliquent toutes seules au démarrage.
 */
const db = databaseUrl.startsWith('postgres')
  ? postgresAdapter({
      pool: { connectionString: databaseUrl, max: Number(process.env.DATABASE_POOL_MAX || 5) },
      schemaName: 'payload',
      push: false,
      migrationDir: path.resolve(dirname, 'migrations'),
      prodMigrations: migrations,
    })
  : sqliteAdapter({ client: { url: databaseUrl } })

/**
 * Stockage des images sur Supabase Storage (API compatible S3) si les variables S3_*
 * sont définies ; sinon les fichiers restent sur le disque (dossier media/), comme en local.
 * Le bucket est public : les images sont servies directement par Supabase.
 */
const s3PublicUrl = (process.env.S3_PUBLIC_URL || '').replace(/\/$/, '')

const storage = s3Storage({
  enabled: s3Enabled,
  // Garde le même schéma de base, que le stockage cloud soit actif ou non
  alwaysInsertFields: true,
  bucket: process.env.S3_BUCKET || 'media',
  collections: {
    media: s3PublicUrl
      ? {
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            `${s3PublicUrl}/${[prefix, filename].filter(Boolean).join('/')}`,
        }
      : true,
  },
  config: s3ClientConfig,
})

/**
 * Livre en PDF : bucket Supabase PRIVÉ, distinct du bucket public des images.
 * - Pas d'URL publique : Payload ne sert le fichier qu'à un administrateur.
 * - clientUploads : le PDF part directement du navigateur vers Supabase
 *   (sinon Vercel refuse les fichiers de plus de 4,5 Mo). Le bucket doit autoriser
 *   les requêtes PUT depuis l'adresse du site (CORS) : voir docs/claude-projet.
 */
const privateStorage = s3Storage({
  enabled: s3Enabled,
  alwaysInsertFields: true,
  bucket: privateBucket,
  clientUploads: true,
  collections: { 'book-files': true },
  config: s3ClientConfig,
})

/** Envoi d'emails si un serveur SMTP est configuré ; sinon les emails sont affichés dans la console. */
const email = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromAddress: process.env.SMTP_FROM || 'no-reply@inhabit-archi.com',
      defaultFromName: 'InHabit_Archi',
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      },
    })
  : undefined

/**
 * Adresses depuis lesquelles une session (cookie) est acceptée pour les envois de formulaires.
 * Payload ajoute déjà NEXT_PUBLIC_SERVER_URL ; on ajoute les adresses Vercel (préversions,
 * domaine de production) et d'éventuelles adresses supplémentaires (www…), séparées par des virgules.
 * Sans cela, un membre connecté sur une autre adresse ne pourrait pas enregistrer sa lecture.
 */
const allowedOrigins = [
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`,
  process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
  ...(process.env.EXTRA_ALLOWED_ORIGINS || '').split(','),
]
  .map((o) => (o || '').trim().replace(/\/$/, ''))
  .filter(Boolean)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  csrf: allowedOrigins,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' — InHabit admin' },
    // Admin toujours en clair (le client ne veut pas du thème sombre)
    theme: 'light',
    avatar: { Component: '/components/admin/Graphics#Avatar' },
    components: {
      graphics: {
        Logo: '/components/admin/Graphics#Logo',
        Icon: '/components/admin/Graphics#Icon',
      },
      views: {
        dashboard: { Component: '/components/admin/Dashboard#Dashboard' },
      },
    },
  },
  i18n: {
    supportedLanguages: { fr },
    fallbackLanguage: 'fr',
    // Libellés plus naturels que la traduction par défaut
    translations: {
      fr: {
        general: {
          createNew: 'Ajouter',
          createNewLabel: 'Ajouter — {{label}}',
          creatingNewLabel: 'Nouveau — {{label}}',
          true: 'Oui',
          false: 'Non',
        },
      },
    },
  },
  collections: [
    News,
    Projects,
    Publications,
    BookChapters,
    BookFiles,
    Events,
    Media,
    Videos,
    VideoThemes,
    CoachingBookings,
    Appointments,
    ContactMessages,
    TopicSuggestions,
    Orders,
    Members,
    Users,
  ],
  globals: [HomePage, YoutubePage, AboutPage, Book, Coaching, AppointmentSettings, SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db,
  email,
  sharp,
  // Refus clair au-delà de 50 Mo (au lieu d'une erreur obscure du stockage), images comme PDF
  upload: { limits: { fileSize: MAX_UPLOAD_BYTES } },
  plugins: [storage, privateStorage],
})
