import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fr } from '@payloadcms/translations/languages/fr'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Events } from './collections/Events'
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

/** PostgreSQL en production (DATABASE_URL=postgres://…), SQLite en local. */
const db = databaseUrl.startsWith('postgres')
  ? postgresAdapter({ pool: { connectionString: databaseUrl } })
  : sqliteAdapter({ client: { url: databaseUrl } })

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
  plugins: [],
})
