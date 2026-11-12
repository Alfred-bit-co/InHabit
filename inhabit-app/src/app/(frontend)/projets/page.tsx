import type { Metadata } from 'next'
import { AfricaMap } from '@/components/AfricaMap'
import type { MapProject } from '@/components/AfricaMapClient'
import { ProjectCard } from '@/components/Cards'
import { ProjectsNav } from '@/components/ProductsNav'
import { countryName } from '@/lib/africa'
import { getPayloadClient, mediaUrl } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Projets architecturaux',
  description: 'Projets réalisés ou en cours, localisés sur une carte interactive de l’Afrique.',
}

export default async function ProjectsPage() {
  const payload = await getPayloadClient()
  const projects = await payload.find({
    collection: 'projects',
    where: { published: { equals: true } },
    sort: 'order',
    limit: 200,
    depth: 1,
  })

  const mapProjects: MapProject[] = projects.docs.map((p) => ({
    slug: p.slug ?? '',
    title: p.title,
    country: p.country,
    countryName: countryName(p.country, p.countryOther),
    city: p.city,
    year: p.year,
    image: mediaUrl(p.cover, 'thumb'),
  }))

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Projets</span>
          <h1>
            Habiter le continent, <em>projet</em> après projet.
          </h1>
          <p className="lead">
            Projets réalisés ou auxquels j’ai participé : contexte, programme, démarche conceptuelle, plans et images.
          </p>
          <ProjectsNav current="projets" />
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Carte interactive</span>
              <h2>Où se trouvent les projets.</h2>
              <p>Cliquez sur un pays en couleur pour voir les projets qui y ont été développés.</p>
            </div>
          </div>
          <AfricaMap projects={mapProjects} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Tous les projets</span>
              <h2>Réalisations et études.</h2>
            </div>
          </div>
          {projects.docs.length ? (
            <div className="grid grid-3">
              {projects.docs.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <p className="empty">Les projets seront bientôt publiés.</p>
          )}
        </div>
      </section>
    </>
  )
}
