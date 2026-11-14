import type { MetadataRoute } from 'next'
import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Plan du site pour les moteurs de recherche (/sitemap.xml) :
 * pages fixes + projets, actualités, publications et concours publiés.
 */
export const dynamic = 'force-dynamic'

const BASE = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://in-habit.vercel.app').replace(/\/$/, '')

type Freq = MetadataRoute.Sitemap[number]['changeFrequency']

const fixedPages: { path: string; priority: number; changeFrequency: Freq }[] = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/youtube', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/produits', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/produits/livre-concept', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/produits/accompagnement', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/produits/rendez-vous', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/projets', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/projets/recherche', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/projets/concours', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/actualites', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/a-propos', priority: 0.6, changeFrequency: 'monthly' },
]

const collections = [
  { slug: 'projects', prefix: '/projets' },
  { slug: 'news', prefix: '/actualites' },
  { slug: 'publications', prefix: '/projets/recherche' },
  { slug: 'events', prefix: '/projets/concours' },
] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = fixedPages.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified: new Date(),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }))

  try {
    const payload = await getPayload({ config })
    for (const c of collections) {
      const { docs } = await payload.find({
        collection: c.slug,
        where: { published: { equals: true } },
        depth: 0,
        limit: 1000,
        pagination: false,
      })
      for (const d of docs as { slug?: string | null; updatedAt?: string }[]) {
        if (!d.slug) continue
        entries.push({
          url: `${BASE}${c.prefix}/${d.slug}`,
          lastModified: d.updatedAt ? new Date(d.updatedAt) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
        })
      }
    }
  } catch {
    // Base indisponible : on renvoie au moins les pages fixes.
  }

  return entries
}
