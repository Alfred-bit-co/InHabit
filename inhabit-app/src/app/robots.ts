import type { MetadataRoute } from 'next'

/** Règles pour les robots d'indexation (/robots.txt) : tout le site sauf l'admin et l'API. */
const BASE = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://in-habit.vercel.app').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
    sitemap: `${BASE}/sitemap.xml`,
  }
}
