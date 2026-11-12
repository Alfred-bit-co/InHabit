/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import type { Metadata } from 'next'
import { ProductsNav } from '@/components/ProductsNav'
import { RichText } from '@/components/RichText'
import { getPayloadClient, isMedia, mediaAlt, mediaUrl } from '@/lib/payload'

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayloadClient()
  const book = await payload.findGlobal({ slug: 'book', depth: 0 })
  return { title: `Livre ${book.title || 'CONCEPT'}`, description: book.pitch || undefined }
}

export default async function BookPage() {
  const payload = await getPayloadClient()
  const book = await payload.findGlobal({ slug: 'book', depth: 1 })
  const editions = book.editions ?? []
  const excerpts = (book.excerpts ?? []).filter((e) => isMedia(e.image))

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <ProductsNav current="livre" />
        </div>
      </section>

      <section className="section-tight">
        <div className="container split">
          <div>
            {isMedia(book.cover) && (
              <img className="book-cover" src={mediaUrl(book.cover, 'large') ?? ''} alt={mediaAlt(book.cover, 'Couverture')} />
            )}
          </div>
          <div>
            <span className="eyebrow">Le livre</span>
            <h1 style={{ fontSize: 'clamp(3rem, 7vw, 5.6rem)' }}>{book.title || 'CONCEPT'}</h1>
            {book.subtitle && <p className="lead" style={{ color: 'var(--beige)' }}>{book.subtitle}</p>}
            {book.pitch && <p className="lead">{book.pitch}</p>}
            <a href="#editions" className="btn btn-accent" style={{ marginTop: 16 }}>
              Commander le livre
            </a>
          </div>
        </div>
      </section>

      {(book.presentation || book.contents) && (
        <section className="section">
          <div className="container grid grid-2" style={{ alignItems: 'start' }}>
            {book.presentation ? (
              <div>
                <span className="eyebrow">Présentation</span>
                <RichText data={book.presentation} />
              </div>
            ) : null}
            {book.contents ? (
              <div>
                <span className="eyebrow">Contenu et démarche</span>
                <RichText data={book.contents} />
              </div>
            ) : null}
          </div>
        </section>
      )}

      {excerpts.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">Extraits</span>
                <h2>Feuilleter quelques pages.</h2>
              </div>
            </div>
            <div className="excerpts">
              {excerpts.map((e) => (
                <figure key={e.id}>
                  <img src={mediaUrl(e.image, 'large') ?? ''} alt={mediaAlt(e.image, e.caption ?? '')} loading="lazy" />
                  {e.caption && <figcaption>{e.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="editions" className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Éditions disponibles</span>
              <h2>Formats et prix.</h2>
            </div>
          </div>
          {editions.length ? (
            <div className="grid grid-3">
              {editions.map((ed) => (
                <div key={ed.id} className="edition">
                  {isMedia(ed.cover) && (
                    <img
                      src={mediaUrl(ed.cover, 'card') ?? ''}
                      alt={mediaAlt(ed.cover, ed.name)}
                      style={{ borderRadius: 10, aspectRatio: '3/4', objectFit: 'cover', marginBottom: 6 }}
                    />
                  )}
                  <h3 style={{ margin: 0 }}>{ed.name}</h3>
                  {ed.format && <span className="muted">{ed.format}</span>}
                  {ed.price && <span className="price">{ed.price}</span>}
                  <div className="links">
                    {ed.available === false ? (
                      <span className="tag tag-neutral">Bientôt disponible</span>
                    ) : (
                      (ed.links ?? []).map((l) => (
                        <a key={l.id} href={l.url} className="btn btn-beige btn-sm" target="_blank" rel="noopener noreferrer">
                          {l.label}
                        </a>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">Les éditions seront bientôt annoncées.</p>
          )}
          <p className="muted" style={{ marginTop: 32 }}>
            Envie d’aller plus loin que le livre ?{' '}
            <Link href="/produits/accompagnement" className="link-arrow">
              Découvrir l’Accompagnement CONCEPT
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
