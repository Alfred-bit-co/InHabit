/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { HeroCarousel, type HeroSlide } from '@/components/HeroCarousel'
import { CountUp } from '@/components/motion/CountUp'
import { SplitText } from '@/components/motion/SplitText'
import { TextReveal } from '@/components/motion/TextReveal'
import { Tilt } from '@/components/motion/Tilt'
import { YouTubeEmbed } from '@/components/YouTubeEmbed'
import { countryName } from '@/lib/africa'
import { EVENT_TYPES, NEWS_TYPES, PROJECT_STATUS } from '@/lib/constants'
import { formatShortDate } from '@/lib/dates'
import { getPayloadClient, getSettings, isMedia, mediaAlt, mediaUrl } from '@/lib/payload'
import { fetchChannelVideos, fromCollection, type YtVideo } from '@/lib/youtube'

export default async function HomePage() {
  const payload = await getPayloadClient()
  const settings = await getSettings()

  const [home, book, coaching, rdv, news, projects, events, featuredVideo, latestSaved] = await Promise.all([
    payload.findGlobal({ slug: 'home', depth: 1 }),
    payload.findGlobal({ slug: 'book', depth: 1 }),
    payload.findGlobal({ slug: 'coaching', depth: 0 }),
    payload.findGlobal({ slug: 'appointment-settings', depth: 0 }),
    payload.find({ collection: 'news', where: { published: { equals: true } }, sort: '-date', limit: 4 }),
    payload.find({ collection: 'projects', where: { published: { equals: true } }, sort: 'order', limit: 6 }),
    payload.find({
      collection: 'events',
      where: { and: [{ published: { equals: true } }, { status: { not_equals: 'termine' } }] },
      sort: 'startDate',
      limit: 2,
    }),
    payload.find({ collection: 'videos', where: { featured: { equals: true } }, sort: '-publishedAt', limit: 1 }),
    payload.find({ collection: 'videos', sort: '-publishedAt', limit: 1 }),
  ])

  // Vidéo mise en avant : choix manuel > dernière vidéo de la chaîne > dernière vidéo enregistrée
  let video: YtVideo | undefined = featuredVideo.docs[0] && fromCollection(featuredVideo.docs[0])
  if (!video) video = (await fetchChannelVideos(settings.youtubeChannelId, 1))[0]
  if (!video && latestSaved.docs[0]) video = fromCollection(latestSaved.docs[0])

  const slides: HeroSlide[] = (home.heroCards ?? [])
    .filter((c) => isMedia(c.image))
    .map((c) => ({
      image: mediaUrl(c.image, 'card') ?? '',
      alt: mediaAlt(c.image, c.title),
      title: c.title,
      line1: c.line1,
      line2: c.line2,
      link: c.link,
    }))

  const gallery = projects.docs.filter((p) => isMedia(p.cover)).slice(0, 5)
  const featured = projects.docs.filter((p) => p.featured).slice(0, 3)
  const bento = featured.length >= 3 ? featured : projects.docs.slice(0, 3)

  const updates = [
    ...news.docs.map((n) => ({
      key: `n${n.id}`,
      href: `/actualites/${n.slug}`,
      date: n.date,
      type: NEWS_TYPES[n.type],
      title: n.title,
      thumb: mediaUrl(n.cover, 'thumb'),
    })),
    ...events.docs.map((e) => ({
      key: `e${e.id}`,
      href: `/projets/concours/${e.slug}`,
      date: e.startDate ?? e.createdAt,
      type: EVENT_TYPES[e.type],
      title: e.title,
      thumb: mediaUrl(e.cover, 'thumb'),
    })),
  ]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 5)

  const title = home.heroTitle || 'Architecture'
  const subtitle = home.heroSubtitle || 'begins as'
  const accent = home.heroAccent || 'art'
  const statement =
    home.introText ||
    'InHabit_Archi explore l’architecture, la ville et la pensée spatiale — entre l’Afrique et le reste du monde.'

  return (
    <>
      {/* ───── Bandeau principal ───── */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <h1 className="hero-title" aria-label={`${title} ${subtitle} ${accent}.`}>
                <span className="big">
                  <SplitText text={title} />
                </span>
                <span className="small">
                  <SplitText text={`${subtitle} `} base={0.35} />
                  <SplitText text={`${accent}.`} base={0.7} className="accent" />
                </span>
              </h1>
              <div className="hero-sub fade-up d3">
                <Link href="#decouvrir" className="btn btn-dark">
                  {home.heroCta || 'Commencer la visite'} <span className="arrow">↓</span>
                </Link>
                <Link href="/projets" className="link-arrow">
                  Voir les projets
                </Link>
              </div>
            </div>
            <div className="fade-up d2">
              <Tilt>
                <HeroCarousel slides={slides} />
              </Tilt>
            </div>
          </div>

          {gallery.length > 0 && (
            <div className="expand-gallery fade-up d3">
              {gallery.map((p) => (
                <Link key={p.id} href={`/projets/${p.slug}`} data-cursor="Voir">
                  <img src={mediaUrl(p.cover, 'large') ?? ''} alt={mediaAlt(p.cover, p.title)} loading="lazy" />
                  <span className="label">
                    <span>
                      <strong>{p.title}</strong>
                      <span>{[p.city, countryName(p.country, p.countryOther)].filter(Boolean).join(', ')}</span>
                    </span>
                    <i aria-hidden="true">→</i>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>


      {/* ───── Manifeste ───── */}
      <section id="decouvrir" className="section">
        <div className="container">
          <span className="eyebrow" data-reveal>
            {home.introEyebrow || 'La chaîne InHabit_Archi'}
          </span>
          <TextReveal text={statement} />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 40 }} data-reveal>
            <Link href="/youtube" className="btn btn-dark">
              Découvrir la chaîne <span className="arrow">→</span>
            </Link>
            <Link href="/a-propos" className="btn btn-ghost">
              Notre vision
            </Link>
          </div>
          {!!home.stats?.length && (
            <div className="stats">
              {home.stats.map((s, i) => (
                <div key={s.id} data-reveal style={{ ['--d' as string]: `${i * 0.12}s` }}>
                  <CountUp value={s.value} />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───── Projets ───── */}
      {bento.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-head" data-reveal>
              <div>
                <span className="eyebrow">Projets sélectionnés</span>
                <h2>
                  Des lieux pensés pour être <em>habités</em>.
                </h2>
              </div>
              <Link href="/projets" className="link-arrow">
                Tous les projets
              </Link>
            </div>
            <div className="bento">
              {bento.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/projets/${p.slug}`}
                  className="bento-item"
                  data-reveal="clip"
                  data-cursor="Voir"
                  style={{ ['--d' as string]: `${i * 0.15}s` }}
                >
                  <img src={mediaUrl(p.cover, 'large') ?? ''} alt={mediaAlt(p.cover, p.title)} loading="lazy" />
                  <div className="bento-info">
                    <span>
                      {[countryName(p.country, p.countryOther), p.year, p.status && PROJECT_STATUS[p.status]]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <h3>{p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───── Dernière vidéo ───── */}
      {video && (
        <section className="section">
          <div className="container">
            <div className="section-head" data-reveal>
              <div>
                <span className="eyebrow">Dernière vidéo</span>
                <h2>
                  Penser l’espace, <em>en vidéo</em>.
                </h2>
              </div>
              <Link href="/youtube" className="link-arrow">
                Toutes les vidéos
              </Link>
            </div>
            <div data-reveal>
              <YouTubeEmbed id={video.id} title={video.title} maxres />
            </div>
            <div
              data-reveal
              style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginTop: 22 }}
            >
              <h3 style={{ fontSize: 'clamp(1.3rem, 2.4vw, 2rem)', margin: 0, maxWidth: '30ch' }}>{video.title}</h3>
              {video.publishedAt && <span className="muted">{formatShortDate(video.publishedAt)}</span>}
            </div>
          </div>
        </section>
      )}

      {/* ───── Livre CONCEPT ───── */}
      <section className="section section-sand">
        <div className="container split">
          <div className="book-stage" data-reveal>
            {isMedia(book.cover) && (
              <div className="book-3d">
                <img src={mediaUrl(book.cover, 'large') ?? ''} alt={mediaAlt(book.cover, 'Livre CONCEPT')} />
              </div>
            )}
          </div>
          <div data-reveal style={{ ['--d' as string]: '0.15s' }}>
            <span className="eyebrow">Le livre</span>
            <h2 style={{ fontSize: 'clamp(3.4rem, 8vw, 7.4rem)', marginBottom: '0.15em' }}>
              {book.title || 'CONCEPT'}
            </h2>
            {book.subtitle && (
              <p className="serif" style={{ fontSize: 'clamp(1.4rem, 2.4vw, 2rem)', color: 'var(--accent)' }}>
                {book.subtitle}
              </p>
            )}
            {book.pitch && <p className="lead">{book.pitch}</p>}
            {!!book.editions?.length && (
              <div className="choices" style={{ margin: '24px 0 32px' }}>
                {book.editions.map((e) => (
                  <span key={e.id} className="tag tag-neutral" style={{ padding: '8px 14px', fontSize: '0.86rem' }}>
                    {e.name}
                    {e.price ? ` · ${e.price}` : ''}
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/produits/livre-concept" className="btn btn-dark">
                Découvrir le livre <span className="arrow">→</span>
              </Link>
              <Link href="/produits/livre-concept#editions" className="btn btn-ghost">
                Commander
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Services ───── */}
      <section className="section">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <span className="eyebrow">Produits & services</span>
              <h2>
                Lire, apprendre, <em>construire</em>.
              </h2>
            </div>
            <Link href="/produits" className="link-arrow">
              Tout voir
            </Link>
          </div>
          <div className="grid grid-3">
            <div className="service" data-reveal>
              <span className="num">01 — Publication</span>
              <h3>Livre {book.title || 'CONCEPT'}</h3>
              <p>Apprendre à concevoir un concept architectural, avec plus de 20 architectes à travers le monde.</p>
              <Link href="/produits/livre-concept" className="btn btn-ghost btn-sm">
                Découvrir
              </Link>
            </div>
            <div className="service featured" data-reveal style={{ ['--d' as string]: '0.12s' }}>
              <span className="num">02 — Accompagnement</span>
              <h3>{coaching.title || 'Accompagnement CONCEPT'}</h3>
              <p>{coaching.intro}</p>
              <div className="price-box">
                {coaching.price && <strong>{coaching.price}</strong>}
                <span className="muted">{coaching.durationWeeks ?? 4} semaines · places limitées</span>
              </div>
              <Link href="/produits/accompagnement" className="btn btn-beige btn-sm">
                Réserver une place <span className="arrow">→</span>
              </Link>
            </div>
            <div className="service" data-reveal style={{ ['--d' as string]: '0.24s' }}>
              <span className="num">03 — Gratuit</span>
              <h3>{rdv.title || 'Rendez-vous architectural'}</h3>
              <p>{rdv.intro}</p>
              <Link href="/produits/rendez-vous" className="btn btn-ghost btn-sm">
                Choisir un créneau
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Actualités ───── */}
      {updates.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-head" data-reveal>
              <div>
                <span className="eyebrow">Actualités</span>
                <h2>
                  Ce qui se passe <em>en ce moment</em>.
                </h2>
              </div>
              <Link href="/actualites" className="link-arrow">
                Toutes les actualités
              </Link>
            </div>
            <div className="rows" data-reveal>
              {updates.map((u) => (
                <Link key={u.key} href={u.href} className="row">
                  <time dateTime={String(u.date)}>{formatShortDate(String(u.date))}</time>
                  <span className="type">{u.type}</span>
                  <h3>{u.title}</h3>
                  <span className="thumb" aria-hidden="true">
                    {u.thumb && <img src={u.thumb} alt="" loading="lazy" />}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───── Appels à l'action ───── */}
      <section className="section-tight">
        <div className="container cta-band">
          <div className="cta-accent" data-reveal>
            <h3>{home.appointmentTitle}</h3>
            <p>{home.appointmentText}</p>
            <Link href="/produits/rendez-vous" className="btn btn-beige">
              Prendre rendez-vous <span className="arrow">→</span>
            </Link>
          </div>
          <div className="cta-beige" data-reveal style={{ ['--d' as string]: '0.12s' }}>
            <h3>{home.partnerTitle}</h3>
            <p>{home.partnerText}</p>
            <Link href="/a-propos?motif=partenariat#contact" className="btn btn-dark">
              Proposer un partenariat <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
