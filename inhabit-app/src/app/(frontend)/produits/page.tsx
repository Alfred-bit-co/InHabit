/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import type { Metadata } from 'next'
import { ProductsNav } from '@/components/ProductsNav'
import { getPayloadClient, isMedia, mediaAlt, mediaUrl } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Produits & services',
  description: 'Le livre CONCEPT, l’Accompagnement CONCEPT et le rendez-vous architectural gratuit.',
}

export default async function ProductsPage() {
  const payload = await getPayloadClient()
  const [book, coaching, rdv] = await Promise.all([
    payload.findGlobal({ slug: 'book', depth: 1 }),
    payload.findGlobal({ slug: 'coaching' }),
    payload.findGlobal({ slug: 'appointment-settings' }),
  ])

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Produits & services</span>
          <h1>
            Lire, apprendre, <em>construire</em>.
          </h1>
          <p className="lead">Des publications et des accompagnements pour développer une pensée architecturale juste.</p>
          <ProductsNav current="overview" />
        </div>
      </section>

      <section className="section-tight">
        <div className="container grid grid-3">
          <div className="service">
            <span className="num">01 — PUBLICATION</span>
            {isMedia(book.cover) && (
              <img
                src={mediaUrl(book.cover, 'card') ?? ''}
                alt={mediaAlt(book.cover, 'Livre CONCEPT')}
                style={{ borderRadius: 12, aspectRatio: '4/3', objectFit: 'cover', width: '100%' }}
              />
            )}
            <h3>Livre {book.title || 'CONCEPT'}</h3>
            <p>{book.pitch}</p>
            <Link href="/produits/livre-concept" className="btn btn-beige">
              Découvrir le livre
            </Link>
          </div>
          <div className="service">
            <span className="num">02 — SERVICE PAYANT</span>
            <h3>{coaching.title || 'Accompagnement CONCEPT'}</h3>
            <p>{coaching.intro}</p>
            <div className="price-box">
              {coaching.price && <strong>{coaching.price}</strong>}
              <span className="muted">· {coaching.durationWeeks ?? 4} semaines · places limitées</span>
            </div>
            <Link href="/produits/accompagnement" className="btn btn-accent">
              Réserver une place
            </Link>
          </div>
          <div className="service">
            <span className="num">03 — SERVICE GRATUIT</span>
            <h3>{rdv.title || 'Rendez-vous architectural'}</h3>
            <p>{rdv.intro}</p>
            <div className="price-box">
              <strong>Gratuit</strong>
              <span className="muted">· {rdv.durationMinutes ?? 30} min</span>
            </div>
            <Link href="/produits/rendez-vous" className="btn btn-beige">
              Choisir un créneau
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
