/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import type { Metadata } from 'next'
import { ProductsNav } from '@/components/ProductsNav'
import { getPayloadClient, isMedia, mediaAlt, mediaUrl } from '@/lib/payload'
import type { AppointmentSetting, Book, Coaching, Media, ProductsPage as ProductsPageData } from '@/payload-types'

const DEFAULT_INTRO = 'Des publications et des accompagnements pour développer une pensée architecturale juste.'

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayloadClient()
  const page = await payload.findGlobal({ slug: 'products-page', depth: 0 })
  return { title: 'Produits & services', description: page.intro || DEFAULT_INTRO }
}

type Row = NonNullable<ProductsPageData['products']>[number]

/** Cartes affichées tant que la page n'a jamais été enregistrée dans l'admin (= la page d'origine). */
const DEFAULT_ROWS: Row[] = [
  { kind: 'livre', visible: true, label: 'Publication', buttonStyle: 'beige' },
  { kind: 'accompagnement', visible: true, label: 'Service payant', buttonStyle: 'accent' },
  { kind: 'rendez-vous', visible: true, label: 'Service gratuit', buttonStyle: 'beige' },
]

type Card = {
  key: string
  label: string
  title: string
  description?: string | null
  image: Media | null
  price?: string | null
  priceNote?: string | null
  button?: { label: string; href: string; accent: boolean; external: boolean }
}

/**
 * Carte d'un produit : ce qui est rempli dans « Page Produits » l'emporte ;
 * pour le livre, l'accompagnement et le rendez-vous, un champ vide reprend le texte de leur page.
 */
function toCard(row: Row, i: number, book: Book, coaching: Coaching, rdv: AppointmentSetting): Card {
  const own = <T,>(v: T | null | undefined) => (typeof v === 'string' ? v.trim() || undefined : (v ?? undefined))
  const base = (() => {
    switch (row.kind) {
      case 'livre':
        return {
          title: `Livre ${book.title || 'CONCEPT'}`,
          description: book.pitch,
          image: isMedia(book.cover) ? book.cover : null,
          href: '/produits/livre-concept',
          buttonLabel: 'Découvrir le livre',
        }
      case 'accompagnement':
        return {
          title: coaching.title || 'Accompagnement CONCEPT',
          description: coaching.intro,
          price: coaching.price,
          priceNote: `${coaching.durationWeeks ?? 4} semaines · places limitées`,
          href: '/produits/accompagnement',
          buttonLabel: 'Réserver une place',
        }
      case 'rendez-vous':
        return {
          title: rdv.title || 'Rendez-vous architectural',
          description: rdv.intro,
          price: 'Gratuit',
          priceNote: `${rdv.durationMinutes ?? 30} min`,
          href: '/produits/rendez-vous',
          buttonLabel: 'Choisir un créneau',
        }
      default:
        return { title: 'Produit', href: own(row.link), buttonLabel: 'En savoir plus' }
    }
  })() as {
    title: string
    description?: string | null
    image?: Media | null
    price?: string | null
    priceNote?: string | null
    href?: string
    buttonLabel: string
  }

  const href = base.href
  const external = Boolean(href && !href.startsWith('/'))
  return {
    key: row.id || `${row.kind}-${i}`,
    label: `${String(i + 1).padStart(2, '0')}${row.label ? ` — ${row.label}` : ''}`.toUpperCase(),
    title: own(row.title) ?? base.title,
    description: own(row.description) ?? base.description,
    image: isMedia(row.image) ? row.image : (base.image ?? null),
    price: own(row.price) ?? base.price,
    priceNote: own(row.priceNote) ?? base.priceNote,
    button: href
      ? { label: own(row.buttonLabel) ?? base.buttonLabel, href, accent: row.buttonStyle === 'accent', external }
      : undefined,
  }
}

export default async function ProductsPage() {
  const payload = await getPayloadClient()
  const [page, book, coaching, rdv] = await Promise.all([
    payload.findGlobal({ slug: 'products-page', depth: 1 }),
    payload.findGlobal({ slug: 'book', depth: 1 }),
    payload.findGlobal({ slug: 'coaching', depth: 0 }),
    payload.findGlobal({ slug: 'appointment-settings', depth: 0 }),
  ])

  // Jamais enregistrée dans l'admin : on garde les trois produits d'origine
  const rows = page.updatedAt ? (page.products ?? []) : DEFAULT_ROWS
  const cards = rows.filter((r) => r.visible !== false).map((r, i) => toCard(r, i, book, coaching, rdv))
  const title = page.updatedAt ? page.title : 'Lire, apprendre,'
  const accent = page.updatedAt ? page.titleAccent : 'construire'

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{page.eyebrow || 'Produits & services'}</span>
          <h1>
            {title}
            {title && accent ? ' ' : ''}
            {accent && <em>{accent}</em>}
            {(title || accent) && '.'}
          </h1>
          <p className="lead">{page.intro || DEFAULT_INTRO}</p>
          <ProductsNav current="overview" />
        </div>
      </section>

      <section className="section-tight">
        <div className="container grid grid-3">
          {cards.length === 0 && <p className="muted">Aucun produit pour le moment.</p>}
          {cards.map((c) => (
            <div className="service" key={c.key}>
              <span className="num">{c.label}</span>
              {c.image && (
                <img
                  src={mediaUrl(c.image, 'card') ?? ''}
                  alt={mediaAlt(c.image, c.title)}
                  loading="lazy"
                  style={{ borderRadius: 12, aspectRatio: '4/3', objectFit: 'cover', width: '100%' }}
                />
              )}
              <h3>{c.title}</h3>
              {c.description && <p>{c.description}</p>}
              {(c.price || c.priceNote) && (
                <div className="price-box">
                  {c.price && <strong>{c.price}</strong>}
                  {c.priceNote && <span className="muted">{c.price ? '· ' : ''}{c.priceNote}</span>}
                </div>
              )}
              {c.button &&
                (c.button.external ? (
                  <a
                    href={c.button.href}
                    className={`btn ${c.button.accent ? 'btn-accent' : 'btn-beige'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {c.button.label}
                  </a>
                ) : (
                  <Link href={c.button.href} className={`btn ${c.button.accent ? 'btn-accent' : 'btn-beige'}`}>
                    {c.button.label}
                  </Link>
                ))}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
