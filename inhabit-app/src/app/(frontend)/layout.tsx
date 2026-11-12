import type { Metadata, Viewport } from 'next'
import { Urbanist } from 'next/font/google'
import React from 'react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Motion } from '@/components/motion/Motion'
import { themeScript } from '@/components/ThemeToggle'
import { getSettings } from '@/lib/payload'
import './styles.css'

// Contenu toujours à jour : chaque modification dans l'admin est visible immédiatement.
export const dynamic = 'force-dynamic'

// Police de la maquette : Century Gothic quand l'appareil l'a,
// sinon Urbanist (mêmes formes géométriques, « a » et « g » ronds).
const sans = Urbanist({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-main',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const name = settings.siteName || 'InHabit_Archi'
  return {
    metadataBase: process.env.NEXT_PUBLIC_SERVER_URL ? new URL(process.env.NEXT_PUBLIC_SERVER_URL) : undefined,
    title: { default: `${name} — Architecture, livre et projets`, template: `%s — ${name}` },
    description: settings.tagline || undefined,
    openGraph: { siteName: name, locale: 'fr_FR', type: 'website' },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3eee6' },
    { media: '(prefers-color-scheme: dark)', color: '#333333' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()
  return (
    <html lang="fr" className={sans.variable} data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#contenu">
          Aller au contenu
        </a>
        <Header />
        <main id="contenu">{children}</main>
        <Footer settings={settings} />
        <Motion />
      </body>
    </html>
  )
}
