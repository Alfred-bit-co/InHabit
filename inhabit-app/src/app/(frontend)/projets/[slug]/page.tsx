/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ProjectCard } from '@/components/Cards'
import { RichText } from '@/components/RichText'
import { countryName } from '@/lib/africa'
import { PROJECT_STATUS } from '@/lib/constants'
import { getPayloadClient, isMedia, mediaAlt, mediaUrl } from '@/lib/payload'

type Props = { params: Promise<{ slug: string }> }

async function getProject(slug: string) {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'projects',
    where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] },
    limit: 1,
    depth: 1,
  })
  return res.docs[0]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProject((await params).slug)
  if (!p) return {}
  const image = mediaUrl(p.cover, 'large')
  return { title: p.title, description: p.summary, openGraph: image ? { images: [image] } : undefined }
}

const KIND: Record<string, string> = { photo: 'Photographie', plan: 'Plan', perspective: 'Perspective', dessin: 'Dessin' }

export default async function ProjectDetail({ params }: Props) {
  const project = await getProject((await params).slug)
  if (!project) notFound()

  const payload = await getPayloadClient()
  const others = await payload.find({
    collection: 'projects',
    where: { and: [{ published: { equals: true } }, { id: { not_equals: project.id } }] },
    sort: 'order',
    limit: 3,
  })

  const place = countryName(project.country, project.countryOther)
  const gallery = (project.gallery ?? []).filter((g) => isMedia(g.image))

  return (
    <article>
      <section className="section-tight">
        <div className="container">
          <Link href="/projets" className="back-link">
            ← Tous les projets
          </Link>
          <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)', maxWidth: '18ch' }}>{project.title}</h1>
          <p className="lead" style={{ maxWidth: '62ch' }}>{project.summary}</p>
          <div className="detail-hero" style={{ marginTop: 32 }}>
            <img src={mediaUrl(project.cover, 'large') ?? ''} alt={mediaAlt(project.cover, project.title)} />
          </div>
          <dl className="facts">
            <div>
              <dt>Localisation</dt>
              <dd>{[project.city, place].filter(Boolean).join(', ') || '—'}</dd>
            </div>
            {project.year && (
              <div>
                <dt>Année</dt>
                <dd>{project.year}</dd>
              </div>
            )}
            {project.status && (
              <div>
                <dt>Statut</dt>
                <dd>{PROJECT_STATUS[project.status]}</dd>
              </div>
            )}
            {project.role && (
              <div>
                <dt>Rôle</dt>
                <dd>{project.role}</dd>
              </div>
            )}
          </dl>

          <div className="grid grid-2" style={{ alignItems: 'start' }}>
            {project.context && (
              <div>
                <span className="eyebrow">Contexte</span>
                <p className="prose" style={{ whiteSpace: 'pre-line' }}>{project.context}</p>
              </div>
            )}
            {project.program && (
              <div>
                <span className="eyebrow">Programme</span>
                <p className="prose" style={{ whiteSpace: 'pre-line' }}>{project.program}</p>
              </div>
            )}
          </div>
          {project.approach ? (
            <div style={{ marginTop: 32 }}>
              <span className="eyebrow">Démarche conceptuelle</span>
              <RichText data={project.approach} />
            </div>
          ) : null}
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">Galerie</span>
                <h2>Images, plans et perspectives.</h2>
              </div>
            </div>
            <div className="gallery">
              {gallery.map((g) => (
                <figure key={g.id}>
                  <img src={mediaUrl(g.image, 'large') ?? ''} alt={mediaAlt(g.image, g.caption ?? project.title)} loading="lazy" />
                  <figcaption>{[g.kind && KIND[g.kind], g.caption].filter(Boolean).join(' — ')}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {others.docs.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">À voir aussi</span>
                <h2>Autres projets.</h2>
              </div>
            </div>
            <div className="grid grid-3">
              {others.docs.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}
