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

import { Events } from './collections/Events'
import { migrations } from './migrations'
import { Media } from './collections/Media'
import { News } from './collections/News'
import { Projects } from './collections/Projects'
import { Publications } from './collections/Publications'
import { Appointments, CoachingBookings, ContactMessages, TopicSuggestions } from './collections/Requests'
import { Users } from './collections/Users'
import { Videos, VideoThemes } from './collections/Videos'
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
const s3Enabled = Boolean(
  process.env.S3_BUCKET && process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY,
)
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
  config: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'eu-west-3',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  },
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

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
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
    Events,
    Media,
    Videos,
    VideoThemes,
    CoachingBookings,
    Appointments,
    ContactMessages,
    TopicSuggestions,
    Users,
  ],
  globals: [HomePage, YoutubePage, AboutPage, Book, Coaching, AppointmentSettings, SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db,
  email,
  sharp,
  plugins: [storage],
})
