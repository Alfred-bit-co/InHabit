/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { IconBookmark, IconChevron, IconLock } from '@/components/member/icons'
import { getChapterList, relId } from '@/lib/book'
import { getReadableBookFile } from '@/lib/bookFile'
import { formatShortDate } from '@/lib/dates'
import { requireSubscriber } from '@/lib/member'
import { getPayloadClient, isMedia, mediaAlt, mediaUrl } from '@/lib/payload'

export default async function LibraryPage() {
  const member = await requireSubscriber()
  const payload = await getPayloadClient()
  const [book, chapters, pdf] = await Promise.all([
    payload.findGlobal({ slug: 'book', depth: 1 }),
    getChapterList(member),
    getReadableBookFile(member),
  ])

  const title = book.title || 'CONCEPT'

  // Version texte (chapitres)
  const readable = chapters.filter((c) => c.readable)
  const currentId = relId(member.readingChapter)
  const current = readable.find((c) => c.id === currentId) ?? readable[0]
  const position = current && current.id === currentId ? (member.readingPosition ?? 0) : 0
  const idx = current ? readable.indexOf(current) : 0
  const progress = readable.length ? Math.round(((idx + position) / readable.length) * 100) : 0

  const chapterById = new Map(chapters.map((c) => [c.id, c]))
  const recentMarks = [...(member.bookmarks ?? [])].reverse().slice(0, 3)

  return (
    <div className="member-page">
      <header className="member-head">
        <div>
          <span className="eyebrow">Ma bibliothèque</span>
          <h1>Votre lecture vous attend.</h1>
        </div>
      </header>

      <div className="library-hero">
        <div className="library-cover">
          {isMedia(book.cover) ? (
            <img src={mediaUrl(book.cover, 'card') ?? ''} alt={mediaAlt(book.cover, `Couverture de ${title}`)} />
          ) : (
            <div className="library-cover-fallback">{title}</div>
          )}
        </div>
        <div className="library-info">
          <span className="tag">Édition numérique</span>
          <h2>{title}</h2>
          {book.subtitle && <p className="muted">{book.subtitle}</p>}
          {member.bookAccessUntil && (
            <p className="muted progress-label">Accès jusqu’au {formatShortDate(member.bookAccessUntil)}</p>
          )}

          {pdf ? (
            <>
              <p className="library-current">
                {member.pdfPage ? (
                  <>
                    Vous en êtes à la <strong>page {member.pdfPage}</strong>.
                  </>
                ) : (
                  <>Votre exemplaire numérique est prêt.</>
                )}
              </p>
              <div className="library-actions">
                <Link href="/espace-membre/livre" className="btn btn-accent">
                  {member.pdfPage ? 'Reprendre la lecture' : 'Commencer la lecture'}{' '}
                  <span className="arrow">→</span>
                </Link>
              </div>
            </>
          ) : current ? (
            <>
              <p className="library-current">
                {currentId ? 'Vous en êtes à' : 'Commencez par'} : <strong>Chapitre {current.number} — {current.title}</strong>
              </p>
              <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progression de lecture">
                <span style={{ width: `${progress}%` }} />
              </div>
              <span className="muted progress-label">{progress} % lu</span>
              <div className="library-actions">
                <Link href={`/espace-membre/lecture/${current.id}`} className="btn btn-accent">
                  {currentId ? 'Reprendre la lecture' : 'Commencer la lecture'} <span className="arrow">→</span>
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="muted">Le livre sera bientôt disponible en lecture en ligne.</p>
            </>
          )}
        </div>
      </div>

      <div className={chapters.length ? 'library-grid' : undefined}>
        {chapters.length > 0 && (
          <section className="member-card">
            <h3>Sommaire{pdf ? ' — version texte' : ''}</h3>
            <ol className="toc">
              {chapters.map((c, i) => {
                const showPart = c.part && c.part !== chapters[i - 1]?.part
                return (
                  <li key={c.id}>
                    {showPart && <span className="toc-part">{c.part}</span>}
                    {c.readable ? (
                      <Link href={`/espace-membre/lecture/${c.id}`} aria-current={c.id === currentId ? 'step' : undefined}>
                        <span className="toc-num">{String(c.number).padStart(2, '0')}</span>
                        <span className="toc-title">{c.title}</span>
                        <IconChevron size={16} />
                      </Link>
                    ) : (
                      <span className="toc-locked">
                        <span className="toc-num">{String(c.number).padStart(2, '0')}</span>
                        <span className="toc-title">{c.title}</span>
                        <IconLock />
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        <section className="member-card">
          <h3>Derniers marque-pages</h3>
          {recentMarks.length ? (
            <ul className="mark-list">
              {recentMarks.map((b) => {
                const ch = chapterById.get(relId(b.chapter) ?? -1)
                const href = b.page
                  ? `/espace-membre/livre?page=${b.page}`
                  : `/espace-membre/lecture/${relId(b.chapter)}?pos=${b.position ?? 0}`
                return (
                  <li key={b.id}>
                    <Link href={href}>
                      <IconBookmark size={16} />
                      <span>
                        <strong>{b.page ? `Page ${b.page}` : ch ? `Ch. ${ch.number} — ${ch.title}` : 'Chapitre'}</strong>
                        {b.excerpt && !b.page && <small>« {b.excerpt} »</small>}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="muted">
              Pendant la lecture, touchez <IconBookmark size={14} /> pour garder une page. Elle apparaîtra ici.
            </p>
          )}
          <Link href="/espace-membre/marque-pages" className="link-arrow" style={{ marginTop: 12 }}>
            Tous mes marque-pages
          </Link>
        </section>
      </div>
    </div>
  )
}
