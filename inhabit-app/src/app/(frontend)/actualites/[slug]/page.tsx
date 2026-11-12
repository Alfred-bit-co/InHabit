/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RichText } from '@/components/RichText'
import { NEWS_TYPES } from '@/lib/constants'
import { formatShortDate } from '@/lib/dates'
import { getPayloadClient, mediaAlt, mediaUrl } from '@/lib/payload'

type Props = { params: Promise<{ slug: string }> }

async function getItem(slug: string) {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'news',
    where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] },
    limit: 1,
  })
  return res.docs[0]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getItem((await params).slug)
  return item ? { title: item.title, description: item.excerpt } : {}
}

export default async function NewsDetail({ params }: Props) {
  const item = await getItem((await params).slug)
  if (!item) notFound()
  const cover = mediaUrl(item.cover, 'large')

  return (
    <article className="section-tight">
      <div className="container">
        <Link href="/actualites" className="back-link">
          ← Toutes les actualités
        </Link>
        <div className="card-meta" style={{ marginBottom: 16 }}>
          <span className="tag">{NEWS_TYPES[item.type]}</span>
          <span>{formatShortDate(item.date)}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', maxWidth: '20ch' }}>{item.title}</h1>
        <p className="lead" style={{ maxWidth: '60ch' }}>{item.excerpt}</p>
        {cover && (
          <div className="detail-hero" style={{ margin: '32px 0' }}>
            <img src={cover} alt={mediaAlt(item.cover, item.title)} />
          </div>
        )}
        <RichText data={item.content} />
        {item.link && (
          <p style={{ marginTop: 32 }}>
            <a href={item.link} className="btn btn-accent" target="_blank" rel="noopener noreferrer">
              En savoir plus / s’inscrire
            </a>
          </p>
        )}
      </div>
    </article>
  )
}
