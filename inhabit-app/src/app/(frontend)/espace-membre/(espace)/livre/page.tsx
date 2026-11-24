import Link from 'next/link'
import { PdfReader } from '@/components/member/PdfReader'
import { createReaderToken, getReadableBookFile, readerKey } from '@/lib/bookFile'
import { firstName, requireSubscriber } from '@/lib/member'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export default async function PdfBookPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const member = await requireSubscriber('/espace-membre/livre')
  const { page } = await searchParams
  const payload = await getPayloadClient()
  const [book, file] = await Promise.all([payload.findGlobal({ slug: 'book', depth: 0 }), getReadableBookFile(member)])

  if (!file || !file.filesize) {
    return (
      <div className="member-page">
        <header className="member-head">
          <div>
            <span className="eyebrow">Lecture</span>
            <h1>Le livre arrive bientôt.</h1>
          </div>
        </header>
        <p className="muted">La version en ligne n’est pas encore disponible.</p>
        <Link href="/espace-membre" className="link-arrow">
          Retour à ma bibliothèque
        </Link>
      </div>
    )
  }

  const token = createReaderToken(member.id, file.id)
  const requested = Number(page)
  const initialPage = Number.isInteger(requested) && requested > 0 ? requested : (member.pdfPage ?? 1)
  const marks = (member.bookmarks ?? []).map((b) => b.page).filter((p): p is number => typeof p === 'number')

  return (
    <PdfReader
      key={file.id}
      bookTitle={book.title || 'CONCEPT'}
      token={token}
      scrambleKey={readerKey(token).toString('hex')}
      size={file.filesize}
      initialPage={initialPage}
      marks={marks}
      reader={{ name: member.name || firstName(member), email: member.email }}
    />
  )
}
