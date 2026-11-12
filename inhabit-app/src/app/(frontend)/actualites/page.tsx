import Link from 'next/link'
import type { Metadata } from 'next'
import { NewsCard } from '@/components/Cards'
import { NEWS_TYPES } from '@/lib/constants'
import { getPayloadClient } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Actualités',
  description: 'Concours en cours, événements, conférences et annonces d’InHabit_Archi.',
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams
  const filter = type && NEWS_TYPES[type] ? type : undefined
  const payload = await getPayloadClient()
  const news = await payload.find({
    collection: 'news',
    where: {
      and: [{ published: { equals: true } }, ...(filter ? [{ type: { equals: filter } }] : [])],
    },
    sort: '-date',
    limit: 60,
  })

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Actualités</span>
          <h1>
            Ce qui se passe <em>chez InHabit</em>.
          </h1>
          <p className="lead">Concours en cours, événements, conférences et annonces.</p>
          <nav className="filters subnav" aria-label="Filtrer les actualités">
            <Link href="/actualites" aria-current={!filter ? 'page' : undefined}>
              Toutes
            </Link>
            {Object.entries(NEWS_TYPES).map(([value, label]) => (
              <Link key={value} href={`/actualites?type=${value}`} aria-current={filter === value ? 'page' : undefined}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
      <section className="section-tight">
        <div className="container">
          {news.docs.length ? (
            <div className="grid grid-3">
              {news.docs.map((n) => (
                <NewsCard key={n.id} item={n} />
              ))}
            </div>
          ) : (
            <p className="empty">Aucune actualité pour le moment.</p>
          )}
        </div>
      </section>
    </>
  )
}
