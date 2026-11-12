import type { Metadata } from 'next'
import { CoachingForm } from '@/components/forms/CoachingForm'
import { ProductsNav } from '@/components/ProductsNav'
import { RichText } from '@/components/RichText'
import { computeMonths } from '@/lib/availability'
import { getPayloadClient } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Accompagnement CONCEPT',
  description: 'Un accompagnement individuel de quatre semaines pour apprendre à concevoir un concept architectural.',
}

export default async function CoachingPage() {
  const payload = await getPayloadClient()
  const coaching = await payload.findGlobal({ slug: 'coaching' })

  const monthKeys = (coaching.months ?? []).map((m) => m.month)
  const bookings = monthKeys.length
    ? await payload.find({
        collection: 'coaching-bookings',
        where: { and: [{ month: { in: monthKeys } }, { status: { not_equals: 'annulee' } }] },
        limit: 0,
        depth: 0,
        pagination: false,
        select: { month: true },
      })
    : { docs: [] as { month: string }[] }

  const counts: Record<string, number> = {}
  for (const b of bookings.docs) counts[b.month] = (counts[b.month] ?? 0) + 1
  const months = computeMonths(coaching, counts)

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Service payant · individuel</span>
          <h1>{coaching.title || 'Accompagnement CONCEPT'}</h1>
          {coaching.intro && <p className="lead">{coaching.intro}</p>}
          <ProductsNav current="accompagnement" />
        </div>
      </section>

      <section className="section-tight">
        <div className="container split" style={{ alignItems: 'start' }}>
          <div>
            <div className="price-box" style={{ marginBottom: 24 }}>
              {coaching.price && <strong>{coaching.price}</strong>}
              <span className="muted">
                {coaching.durationWeeks ?? 4} semaines · suivi individuel · places limitées chaque mois
              </span>
            </div>
            <RichText data={coaching.description} />
            {!!coaching.objectives?.length && (
              <>
                <h3 style={{ marginTop: 36 }}>Objectifs</h3>
                <ul className="check-list">
                  {coaching.objectives.map((o) => (
                    <li key={o.id}>{o.text}</li>
                  ))}
                </ul>
              </>
            )}
            {!!coaching.modalities?.length && (
              <>
                <h3 style={{ marginTop: 36 }}>Modalités</h3>
                <ul className="check-list">
                  {coaching.modalities.map((o) => (
                    <li key={o.id}>{o.text}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className="panel" id="reserver">
            <h2 style={{ fontSize: '1.8rem' }}>Réserver ma place</h2>
            <p className="muted">Choisissez le mois durant lequel vous souhaitez être accompagné·e.</p>
            <CoachingForm months={months} />
          </div>
        </div>
      </section>
    </>
  )
}
