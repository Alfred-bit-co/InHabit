import Link from 'next/link'
import { IconBookmark } from '@/components/member/icons'
import { getChapterList, relId } from '@/lib/book'
import { formatShortDate } from '@/lib/dates'
import { requireMember } from '@/lib/member'
import { removeBookmark } from '../../actions'

export default async function BookmarksPage() {
  const member = await requireMember('/espace-membre/marque-pages')
  const chapters = new Map((await getChapterList(member)).map((c) => [c.id, c]))
  // Pages du PDF d'abord (dans l'ordre), puis chapitres de la version texte
  const marks = [...(member.bookmarks ?? [])].sort((a, b) => {
    if (a.page || b.page) return (a.page ?? Infinity) - (b.page ?? Infinity)
    const ca = chapters.get(relId(a.chapter) ?? -1)?.number ?? 0
    const cb = chapters.get(relId(b.chapter) ?? -1)?.number ?? 0
    return ca - cb || (a.position ?? 0) - (b.position ?? 0)
  })

  return (
    <div className="member-page">
      <header className="member-head">
        <div>
          <span className="eyebrow">Marque-pages</span>
          <h1>Les passages que vous gardez.</h1>
        </div>
      </header>

      {marks.length ? (
        <ul className="mark-grid">
          {marks.map((b) => {
            const ch = chapters.get(relId(b.chapter) ?? -1)
            const added = b.createdAt ? ` · ${formatShortDate(b.createdAt)}` : ''
            return (
              <li key={b.id} className="member-card mark-card">
                <span className="mark-card-icon">
                  <IconBookmark size={16} />
                </span>
                {b.page ? (
                  <>
                    <span className="muted mark-card-meta">Livre{added}</span>
                    <strong>Page {b.page}</strong>
                  </>
                ) : (
                  <>
                    <span className="muted mark-card-meta">
                      {ch ? `Chapitre ${ch.number}` : 'Chapitre'} · {Math.round((b.position ?? 0) * 100)} %{added}
                    </span>
                    <strong>{ch?.title ?? 'Chapitre retiré'}</strong>
                    {b.excerpt && <p className="mark-card-excerpt">« {b.excerpt} »</p>}
                  </>
                )}
                <div className="mark-card-actions">
                  {b.page ? (
                    <Link href={`/espace-membre/livre?page=${b.page}`} className="btn btn-dark btn-sm">
                      Ouvrir
                    </Link>
                  ) : (
                    ch?.readable && (
                      <Link href={`/espace-membre/lecture/${ch.id}?pos=${b.position ?? 0}`} className="btn btn-dark btn-sm">
                        Ouvrir
                      </Link>
                    )
                  )}
                  <form action={removeBookmark}>
                    <input type="hidden" name="id" value={b.id ?? ''} />
                    <button type="submit" className="btn btn-ghost btn-sm">
                      Retirer
                    </button>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="member-card member-empty">
          <IconBookmark size={28} />
          <p>
            Aucun marque-page pour l’instant. Pendant la lecture, touchez l’icône marque-page en haut à droite pour
            garder un passage.
          </p>
          <Link href="/espace-membre/lecture" className="btn btn-accent btn-sm">
            Reprendre la lecture
          </Link>
        </div>
      )}
    </div>
  )
}
