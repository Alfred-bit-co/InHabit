/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RichText } from '@/components/RichText'
import { EVENT_STATUS, EVENT_TYPES } from '@/lib/constants'
import { formatShortDate } from '@/lib/dates'
import { getPayloadClient, mediaAlt, mediaUrl } from '@/lib/payload'

type Props = { params: Promise<{ slug: string }> }

async function getItem(slug: string) {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'events',
    where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] },
    limit: 1,
  })
  return res.docs[0]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getItem((await params).slug)
  return item ? { title: item.title, description: item.summary } : {}
}

export default async function EventDetail({ params }: Props) {
  const item = await getItem((await params).slug)
  if (!item) notFound()
  const cover = mediaUrl(item.cover, 'large')
  const dates = [item.startDate, item.endDate].filter(Boolean).map((d) => formatShortDate(d)).join(' → ')

  return (
    <article className="section-tight">
      <div className="container">
        <Link href="/projets/concours" className="back-link">
          ← Concours & événements
        </Link>
        <div className="card-meta" style={{ marginBottom: 16 }}>
          <span className="tag">{EVENT_TYPES[item.type]}</span>
          <span className="tag tag-neutral">{EVENT_STATUS[item.status]}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', maxWidth: '22ch' }}>{item.title}</h1>
        <p className="lead" style={{ maxWidth: '62ch' }}>{item.summary}</p>
        <dl className="facts">
          {dates && (
            <div>
              <dt>Dates</dt>
              <dd>{dates}</dd>
            </div>
          )}
          {item.location && (
            <div>
              <dt>Lieu</dt>
              <dd>{item.location}</dd>
            </div>
          )}
        </dl>
        {cover && (
          <div className="detail-hero" style={{ marginBottom: 32 }}>
            <img src={cover} alt={mediaAlt(item.cover, item.title)} />
          </div>
        )}
        <RichText data={item.content} />
        {item.modalities ? (
          <div className="panel" style={{ marginTop: 40 }}>
            <span className="eyebrow">Informations pratiques</span>
            <RichText data={item.modalities} />
          </div>
        ) : null}
        {item.registrationUrl && item.status !== 'termine' && (
          <p style={{ marginTop: 32 }}>
            <a href={item.registrationUrl} className="btn btn-accent" target="_blank" rel="noopener noreferrer">
              S’inscrire / participer
            </a>
          </p>
        )}
      </div>
    </article>
  )
}
