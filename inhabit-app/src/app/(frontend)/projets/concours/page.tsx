import type { Metadata } from 'next'
import { EventCard } from '@/components/Cards'
import { ProjectsNav } from '@/components/ProductsNav'
import { getPayloadClient } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Concours & événements',
  description: 'Les concours organisés par InHabit, les événements et les conférences.',
}

export default async function EventsPage() {
  const payload = await getPayloadClient()
  const events = await payload.find({
    collection: 'events',
    where: { published: { equals: true } },
    sort: '-startDate',
    limit: 100,
  })
  const current = events.docs.filter((e) => e.status !== 'termine')
  const past = events.docs.filter((e) => e.status === 'termine')

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Concours & événements</span>
          <h1>
            Imaginer, débattre, <em>transmettre</em>.
          </h1>
          <p className="lead">Les concours organisés par InHabit, les événements et conférences, et leurs modalités de participation.</p>
          <ProjectsNav current="concours" />
        </div>
      </section>
      <section className="section-tight">
        <div className="container">
          <h2 style={{ fontSize: '1.8rem', marginBottom: 24 }}>À venir et en cours</h2>
          {current.length ? (
            <div className="grid grid-3">
              {current.map((e) => (
                <EventCard key={e.id} item={e} />
              ))}
            </div>
          ) : (
            <p className="empty">Aucun concours ou événement annoncé pour le moment. Revenez bientôt !</p>
          )}
          {past.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.8rem', margin: '64px 0 24px' }}>Éditions passées</h2>
              <div className="grid grid-3">
                {past.map((e) => (
                  <EventCard key={e.id} item={e} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
