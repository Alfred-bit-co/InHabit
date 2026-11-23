/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import type { Metadata } from 'next'
import { PayButton } from '@/components/payments/PayButton'
import { PayNotice } from '@/components/payments/PayNotice'
import { ProductsNav } from '@/components/ProductsNav'
import { RichText } from '@/components/RichText'
import { getMember } from '@/lib/member'
import { getPayloadClient, isMedia, mediaAlt, mediaUrl } from '@/lib/payload'
import { formatMoney } from '@/lib/payments/money'
import { paymentsEnabled } from '@/lib/payments/provider'
import { payBookEdition } from '../../paiement/actions'

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayloadClient()
  const book = await payload.findGlobal({ slug: 'book', depth: 0 })
  return { title: `Livre ${book.title || 'CONCEPT'}`, description: book.pitch || undefined }
}

export default async function BookPage({ searchParams }: { searchParams: Promise<{ paiement?: string }> }) {
  const { paiement } = await searchParams
  const payload = await getPayloadClient()
  const [book, member] = await Promise.all([payload.findGlobal({ slug: 'book', depth: 1 }), getMember()])
  const editions = book.editions ?? []
  const cardPayments = paymentsEnabled()
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
              <a href="#editions" className="btn btn-accent">
                Commander le livre
              </a>
            </div>
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
          <PayNotice status={paiement} />
          {cardPayments && !member && editions.some((ed) => ed.payByCard) && (
            <p className="form-note" style={{ margin: '0 0 20px' }}>
              Pour payer par carte,{' '}
              <Link href="/espace-membre/connexion?suite=%2Fproduits%2Flivre-concept%23editions">connectez-vous</Link> ou créez
              votre compte (email ou Google). L’espace membre et la lecture s’ouvrent dès le paiement confirmé.
            </p>
          )}
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
                  {(ed.price || (ed.payByCard && ed.priceAmount)) && (
                    <span className="price">{ed.price || formatMoney(ed.priceAmount, ed.currency)}</span>
                  )}
                  {ed.digitalAccess && (
                    <span className="muted edition-note">
                      {ed.accessDays ? `Espace membre : ${ed.accessDays} jours de lecture en ligne` : 'Espace membre : lecture en ligne à vie'}
                    </span>
                  )}
                  <div className="links">
                    {ed.available === false ? (
                      <span className="tag tag-neutral">Bientôt disponible</span>
                    ) : (
                      <>
                        {cardPayments && ed.payByCard && !!ed.priceAmount && ed.id && (
                          <form action={payBookEdition}>
                            <input type="hidden" name="edition" value={ed.id} />
                            <PayButton>
                              <CardIcon /> Payer par carte
                            </PayButton>
                          </form>
                        )}
                        {(ed.links ?? []).map((l) => (
                          <a key={l.id} href={l.url} className="btn btn-beige btn-sm" target="_blank" rel="noopener noreferrer">
                            {l.label}
                          </a>
                        ))}
                      </>
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

function CardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19M6.5 15h4" />
    </svg>
  )
}
