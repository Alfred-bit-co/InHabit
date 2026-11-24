import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getChapterList, relId } from '@/lib/book'
import { getReadableBookFile } from '@/lib/bookFile'
import { requireSubscriber } from '@/lib/member'

/**
 * « Lire CONCEPT » : ouvre le livre PDF s'il a été téléversé,
 * sinon la version texte au dernier chapitre lu (ou au premier lisible).
 */
export default async function ReadIndexPage() {
  const member = await requireSubscriber('/espace-membre/lecture')
  if (await getReadableBookFile(member)) redirect('/espace-membre/livre')

  const readable = (await getChapterList(member)).filter((c) => c.readable)
  const last = relId(member.readingChapter)
  const target = readable.find((c) => c.id === last) ?? readable[0]
  if (target) redirect(`/espace-membre/lecture/${target.id}`)

  return (
    <div className="member-page">
      <header className="member-head">
        <div>
          <span className="eyebrow">Lecture</span>
          <h1>Rien à lire pour l’instant.</h1>
        </div>
      </header>
      <p className="muted">Le livre sera bientôt disponible ici.</p>
      <Link href="/espace-membre" className="link-arrow">
        Retour à ma bibliothèque
      </Link>
    </div>
  )
}
