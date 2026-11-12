import type { Metadata } from 'next'
import { AppointmentForm } from '@/components/forms/AppointmentForm'
import { ProductsNav } from '@/components/ProductsNav'
import { computeAvailability } from '@/lib/availability'
import { toISODate } from '@/lib/dates'
import { getPayloadClient } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Rendez-vous architectural gratuit',
  description: 'Vous avez un projet de construction ? Réservez un premier échange gratuit.',
}

export default async function AppointmentPage() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'appointment-settings' })

  const today = toISODate(new Date())
  const upcoming = await payload.find({
    collection: 'appointments',
    where: { and: [{ date: { greater_than_equal: today } }, { status: { not_equals: 'annule' } }] },
    limit: 0,
    pagination: false,
    depth: 0,
    select: { date: true, slot: true },
  })
  const booked = new Set(upcoming.docs.map((a) => `${a.date} ${a.slot}`))
  const days = computeAvailability(settings, booked)

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Service gratuit</span>
          <h1>{settings.title || 'Rendez-vous architectural'}</h1>
          {settings.intro && <p className="lead">{settings.intro}</p>}
          <ProductsNav current="rdv" />
        </div>
      </section>

      <section className="section-tight">
        <div className="container split" style={{ alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}>Comment ça se passe ?</h2>
            <ul className="check-list" style={{ marginTop: 20 }}>
              <li>Choisissez une date et un créneau disponibles.</li>
              <li>Présentez brièvement votre projet : terrain, programme, envies, calendrier.</li>
              <li>Recevez immédiatement la confirmation par email.</li>
              <li>
                Échange de {settings.durationMinutes ?? 30} minutes, en visio ou par téléphone, pour faire le point
                sur votre projet.
              </li>
            </ul>
          </div>
          <div className="panel">
            <AppointmentForm days={days} timezone={settings.timezoneLabel} />
          </div>
        </div>
      </section>
    </>
  )
}
