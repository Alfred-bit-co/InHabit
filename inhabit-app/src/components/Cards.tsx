/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import type { Event, News, Project, Publication } from '@/payload-types'
import { countryName } from '@/lib/africa'
import { EVENT_STATUS, EVENT_TYPES, NEWS_TYPES, PROJECT_STATUS, PUBLICATION_TYPES } from '@/lib/constants'
import { formatShortDate } from '@/lib/dates'
import { mediaAlt, mediaUrl } from '@/lib/payload'

function CardImage({ media, fallback }: { media: Parameters<typeof mediaUrl>[0]; fallback: string }) {
  const src = mediaUrl(media, 'card')
  return <div className="card-media">{src && <img src={src} alt={mediaAlt(media, fallback)} loading="lazy" />}</div>
}

export function ProjectCard({ project }: { project: Project }) {
  const place = [project.city, countryName(project.country, project.countryOther)].filter(Boolean).join(', ')
  return (
    <Link href={`/projets/${project.slug}`} className="card" data-reveal data-cursor="Voir">
      <CardImage media={project.cover} fallback={project.title} />
      <div className="card-body">
        <div className="card-meta">
          {project.status && <span className="tag">{PROJECT_STATUS[project.status]}</span>}
          <span>{[place, project.year].filter(Boolean).join(' · ')}</span>
        </div>
        <h3>{project.title}</h3>
        <p>{project.summary}</p>
        <span className="card-foot link-arrow">Voir le projet</span>
      </div>
    </Link>
  )
}

export function NewsCard({ item }: { item: News }) {
  return (
    <Link href={`/actualites/${item.slug}`} className="card" data-reveal data-cursor="Lire">
      <CardImage media={item.cover} fallback={item.title} />
      <div className="card-body">
        <div className="card-meta">
          <span className="tag">{NEWS_TYPES[item.type] ?? item.type}</span>
          <span>{formatShortDate(item.date)}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.excerpt}</p>
      </div>
    </Link>
  )
}

export function PublicationCard({ item }: { item: Publication }) {
  return (
    <Link href={`/projets/recherche/${item.slug}`} className="card" data-reveal data-cursor="Lire">
      <CardImage media={item.cover} fallback={item.title} />
      <div className="card-body">
        <div className="card-meta">
          <span className="tag">{PUBLICATION_TYPES[item.type] ?? item.type}</span>
          {item.date && <span>{formatShortDate(item.date)}</span>}
        </div>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
      </div>
    </Link>
  )
}

export function EventCard({ item }: { item: Event }) {
  return (
    <Link href={`/projets/concours/${item.slug}`} className="card" data-reveal data-cursor="Lire">
      <CardImage media={item.cover} fallback={item.title} />
      <div className="card-body">
        <div className="card-meta">
          <span className="tag">{EVENT_TYPES[item.type] ?? item.type}</span>
          <span className="tag tag-neutral">{EVENT_STATUS[item.status] ?? item.status}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <div className="card-meta card-foot">
          {item.startDate && <span>{formatShortDate(item.startDate)}</span>}
          {item.location && <span>· {item.location}</span>}
        </div>
      </div>
    </Link>
  )
}
