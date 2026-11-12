/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RichText } from '@/components/RichText'
import { PUBLICATION_TYPES } from '@/lib/constants'
import { formatShortDate } from '@/lib/dates'
import { getPayloadClient, isMedia, mediaAlt, mediaUrl } from '@/lib/payload'

type Props = { params: Promise<{ slug: string }> }

async function getItem(slug: string) {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'publications',
    where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] },
    limit: 1,
  })
  return res.docs[0]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getItem((await params).slug)
  return item ? { title: item.title, description: item.summary } : {}
}

export default async function PublicationDetail({ params }: Props) {
  const item = await getItem((await params).slug)
  if (!item) notFound()
  const cover = mediaUrl(item.cover, 'large')
  const file = isMedia(item.file) ? item.file.url : null

  return (
    <article className="section-tight">
      <div className="container">
        <Link href="/projets/recherche" className="back-link">
          ← Recherche & publications
        </Link>
        <div className="card-meta" style={{ marginBottom: 16 }}>
          <span className="tag">{PUBLICATION_TYPES[item.type]}</span>
          {item.date && <span>{formatShortDate(item.date)}</span>}
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', maxWidth: '22ch' }}>{item.title}</h1>
        <p className="lead" style={{ maxWidth: '62ch' }}>{item.summary}</p>
        {cover && (
          <div className="detail-hero" style={{ margin: '32px 0' }}>
            <img src={cover} alt={mediaAlt(item.cover, item.title)} />
          </div>
        )}
        <RichText data={item.content} />
        {(file || item.externalUrl) && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 32 }}>
            {file && (
              <a href={file} className="btn btn-accent" target="_blank" rel="noopener noreferrer">
                Télécharger le PDF
              </a>
            )}
            {item.externalUrl && (
              <a href={item.externalUrl} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
                Lire la publication
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
