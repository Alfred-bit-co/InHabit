import Link from 'next/link'
import type { Metadata } from 'next'
import { PublicationCard } from '@/components/Cards'
import { ProjectsNav } from '@/components/ProductsNav'
import { PUBLICATION_TYPES } from '@/lib/constants'
import { getPayloadClient } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Recherche & publications',
  description: 'Études, publications, travaux en cours et réflexions autour de l’architecture.',
}

export default async function ResearchPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams
  const filter = type && PUBLICATION_TYPES[type] ? type : undefined
  const payload = await getPayloadClient()
  const items = await payload.find({
    collection: 'publications',
    where: { and: [{ published: { equals: true } }, ...(filter ? [{ type: { equals: filter } }] : [])] },
    sort: '-date',
    limit: 100,
  })

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Recherche & publications</span>
          <h1>
            Penser avant de <em>bâtir</em>.
          </h1>
          <p className="lead">Études et recherches, publications, travaux en cours, articles et réflexions.</p>
          <ProjectsNav current="recherche" />
        </div>
      </section>
      <section className="section-tight">
        <div className="container">
          <nav className="filters" aria-label="Filtrer par catégorie">
            <Link href="/projets/recherche" aria-current={!filter ? 'page' : undefined}>
              Tout
            </Link>
            {Object.entries(PUBLICATION_TYPES).map(([value, label]) => (
              <Link
                key={value}
                href={`/projets/recherche?type=${value}`}
                aria-current={filter === value ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          {items.docs.length ? (
            <div className="grid grid-3">
              {items.docs.map((p) => (
                <PublicationCard key={p.id} item={p} />
              ))}
            </div>
          ) : (
            <p className="empty">Aucune publication dans cette catégorie pour le moment.</p>
          )}
        </div>
      </section>
    </>
  )
}
