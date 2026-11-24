import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BookReader } from '@/components/member/BookReader'
import { IconLock } from '@/components/member/icons'
import { RichText } from '@/components/RichText'
import { getChapterList, relId } from '@/lib/book'
import { requireSubscriber } from '@/lib/member'
import { getPayloadClient } from '@/lib/payload'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ pos?: string }> }

export default async function ReadChapterPage({ params, searchParams }: Props) {
  const [{ id }, { pos }] = await Promise.all([params, searchParams])
  const chapterId = Number(id)
  if (!Number.isInteger(chapterId)) notFound()

  const member = await requireSubscriber(`/espace-membre/lecture/${chapterId}`)
  const payload = await getPayloadClient()
  const [book, chapters, chapter] = await Promise.all([
    payload.findGlobal({ slug: 'book', depth: 0 }),
    getChapterList(member),
    // Contrôle d'accès de la collection appliqué avec le compte du membre
    payload.findByID({ collection: 'book-chapters', id: chapterId, depth: 1, overrideAccess: false, user: member, disableErrors: true }),
  ])

  const entry = chapters.find((c) => c.id === chapterId)
  if (!entry) notFound()

  // Chapitre réservé aux acheteurs
  if (!chapter) {
    return (
      <div className="member-page locked">
        <span className="locked-icon">
          <IconLock size={28} />
        </span>
        <span className="eyebrow">Chapitre {entry.number}</span>
        <h1>{entry.title}</h1>
        <p className="lead">Ce chapitre fait partie de l’édition complète du livre.</p>
        <div className="library-actions">
          <Link href="/produits/livre-concept#editions" className="btn btn-accent">
            Débloquer la lecture <span className="arrow">→</span>
          </Link>
          <Link href="/espace-membre" className="btn btn-beige">
            Retour au sommaire
          </Link>
        </div>
      </div>
    )
  }

  const i = chapters.findIndex((c) => c.id === chapterId)
  const prev = chapters[i - 1]
  const next = chapters[i + 1]

  const fromUrl = pos !== undefined ? Number(pos) : NaN
  const saved = relId(member.readingChapter) === chapterId ? (member.readingPosition ?? 0) : 0
  const initialPosition = Number.isFinite(fromUrl) ? Math.min(1, Math.max(0, fromUrl)) : saved

  const marks = (member.bookmarks ?? [])
    .filter((b) => relId(b.chapter) === chapterId)
    .map((b) => b.position)
    .filter((p): p is number => typeof p === 'number')

  return (
    <BookReader
      key={chapterId}
      bookTitle={book.title || 'CONCEPT'}
      chapter={{ id: chapter.id, number: chapter.number, title: chapter.title }}
      prevId={prev?.readable ? prev.id : null}
      nextId={next?.id ?? null}
      nextLocked={Boolean(next && !next.readable)}
      initialPosition={initialPosition}
      marks={marks}
    >
      <RichText data={chapter.content} className="prose reader-prose" />
    </BookReader>
  )
}
