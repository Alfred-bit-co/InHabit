/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'
import { ContactForm } from '@/components/forms/ContactForm'
import { RichText } from '@/components/RichText'
import { Socials } from '@/components/Socials'
import { CONTACT_REASONS } from '@/lib/constants'
import { getPayloadClient, getSettings, isMedia, mediaAlt, mediaUrl } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'À propos & contact',
  description: 'InHabit_Archi : histoire, vision, fondateur, collaborateurs, partenaires et contact.',
}

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ motif?: string }> }) {
  const { motif } = await searchParams
  const payload = await getPayloadClient()
  const settings = await getSettings()
  const about = await payload.findGlobal({ slug: 'about', depth: 1 })
  const founder = about.founder
  const defaultReason = CONTACT_REASONS.some((r) => r.value === motif) ? motif : undefined

  return (
    <>
      <section className="page-hero">
        <div className="container split" style={{ alignItems: 'end' }}>
          <div>
            <span className="eyebrow">À propos</span>
            <h1>{about.title || 'Habiter, questionner, transmettre.'}</h1>
          </div>
          {about.intro && <p className="lead">{about.intro}</p>}
        </div>
      </section>

      {(about.history || about.vision) && (
        <section className="section-tight">
          <div className="container grid grid-2" style={{ alignItems: 'start' }}>
            {about.history ? (
              <div className="panel">
                <span className="eyebrow">Histoire de la chaîne</span>
                <RichText data={about.history} />
              </div>
            ) : null}
            {about.vision ? (
              <div className="panel">
                <span className="eyebrow">Vision & philosophie</span>
                <RichText data={about.vision} />
              </div>
            ) : null}
          </div>
        </section>
      )}

      {founder?.name && (
        <section className="section">
          <div className="container founder">
            {isMedia(founder.photo) ? (
              <img src={mediaUrl(founder.photo, 'card') ?? ''} alt={mediaAlt(founder.photo, founder.name)} />
            ) : (
              <div />
            )}
            <div>
              <span className="eyebrow">Le fondateur</span>
              <h2 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)' }}>{founder.name}</h2>
              {founder.role && <p className="lead" style={{ color: 'var(--beige)' }}>{founder.role}</p>}
              <RichText data={founder.bio} />
            </div>
          </div>
        </section>
      )}

      {!!about.collaborators?.length && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">L’équipe</span>
                <h2>Collaborateurs et contributeurs.</h2>
              </div>
            </div>
            <div className="grid grid-4">
              {about.collaborators.map((c) => {
                const inner = (
                  <>
                    {isMedia(c.photo) ? (
                      <img src={mediaUrl(c.photo, 'thumb') ?? ''} alt={mediaAlt(c.photo, c.name)} />
                    ) : (
                      <span className="avatar">{c.name.charAt(0)}</span>
                    )}
                    <strong>{c.name}</strong>
                    {c.role && <span>{c.role}</span>}
                  </>
                )
                return c.link ? (
                  <a key={c.id} href={c.link} className="person" target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                ) : (
                  <div key={c.id} className="person">
                    {inner}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {!!about.partners?.length && (
        <section className="section-tight">
          <div className="container">
            <span className="eyebrow">Références & partenaires</span>
            <div className="partners" style={{ marginTop: 16 }}>
              {about.partners.map((p) => {
                const inner = isMedia(p.logo) ? <img src={mediaUrl(p.logo, 'thumb') ?? ''} alt={p.name} /> : p.name
                return p.url ? (
                  <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                ) : (
                  <div key={p.id}>{inner}</div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <section id="contact" className="section">
        <div className="container contact-grid">
          <div className="contact-info">
            <div>
              <span className="eyebrow">Contact & partenariats</span>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Commençons une conversation.</h2>
              <p className="muted">
                Entreprises, institutions, organisateurs d’événements ou simples curieux : choisissez le motif de
                votre demande, nous vous répondrons rapidement.
              </p>
            </div>
            <dl className="contact-info">
              {settings.contactEmail && (
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
                  </dd>
                </div>
              )}
              {settings.phone && (
                <div>
                  <dt>Téléphone / WhatsApp</dt>
                  <dd>{settings.phone}</dd>
                </div>
              )}
              {settings.location && (
                <div>
                  <dt>Localisation</dt>
                  <dd>{settings.location}</dd>
                </div>
              )}
            </dl>
            <Socials settings={settings} style={{ marginTop: 0 }} />
          </div>
          <div className="panel">
            <ContactForm defaultReason={defaultReason} />
          </div>
        </div>
      </section>
    </>
  )
}
