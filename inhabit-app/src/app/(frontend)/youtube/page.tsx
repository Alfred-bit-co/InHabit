import type { Metadata } from 'next'
import { SuggestionForm } from '@/components/forms/SuggestionForm'
import { VideoLibrary } from '@/components/VideoLibrary'
import { YouTubeEmbed } from '@/components/YouTubeEmbed'
import { formatShortDate } from '@/lib/dates'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { fetchChannelVideos, fromCollection } from '@/lib/youtube'

export const metadata: Metadata = {
  title: 'YouTube',
  description: 'La chaîne InHabit_Archi : vision, ligne éditoriale, dernières vidéos et thématiques.',
}

export default async function YoutubePage() {
  const payload = await getPayloadClient()
  const settings = await getSettings()
  const [page, saved, themes, latestFeed] = await Promise.all([
    payload.findGlobal({ slug: 'youtube-page' }),
    payload.find({ collection: 'videos', sort: '-publishedAt', limit: 100, depth: 1 }),
    payload.find({ collection: 'video-themes', sort: 'order', limit: 50 }),
    fetchChannelVideos(settings.youtubeChannelId, 6),
  ])

  const library = saved.docs.map(fromCollection).filter((v) => v.id)
  // Dernières vidéos : flux automatique de la chaîne, sinon les vidéos enregistrées
  const latest = latestFeed.length ? latestFeed : library.slice(0, 6)
  const [first, ...others] = latest
  const channelUrl = settings.youtubeChannelUrl || 'https://www.youtube.com/@InHabit_Archi'
  const subscribeUrl = settings.youtubeChannelId
    ? `https://www.youtube.com/channel/${settings.youtubeChannelId}?sub_confirmation=1`
    : `${channelUrl}?sub_confirmation=1`

  return (
    <>
      <section className="page-hero">
        <div className="container split" style={{ alignItems: 'end' }}>
          <div>
            <span className="eyebrow">La chaîne YouTube</span>
            <h1>{page.title || 'Penser l’espace, en vidéo.'}</h1>
          </div>
          <div>
            {page.vision && <p className="lead">{page.vision}</p>}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
              <a className="btn btn-accent" href={subscribeUrl} target="_blank" rel="noopener noreferrer">
                S’abonner à la chaîne
              </a>
              <a className="btn btn-ghost" href={channelUrl} target="_blank" rel="noopener noreferrer">
                Voir sur YouTube
              </a>
            </div>
          </div>
        </div>
      </section>

      {!!page.editorialLine?.length && (
        <section className="section-tight">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">Ligne éditoriale</span>
                <h2>Ce dont on parle.</h2>
              </div>
            </div>
            <div className="grid grid-3">
              {page.editorialLine.map((axis, i) => (
                <div key={axis.id} className="service">
                  <span className="num">0{i + 1}</span>
                  <h3 style={{ fontSize: '1.4rem' }}>{axis.title}</h3>
                  {axis.text && <p>{axis.text}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {first && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">Dernières vidéos</span>
                <h2>Fraîchement publiées.</h2>
              </div>
            </div>
            <div className="split" style={{ alignItems: 'start' }}>
              <div>
                <YouTubeEmbed id={first.id} title={first.title} maxres />
                <h3 style={{ marginTop: 18, fontSize: '1.5rem' }}>{first.title}</h3>
                {first.publishedAt && <p className="muted">{formatShortDate(first.publishedAt)}</p>}
              </div>
              <div className="grid grid-2">
                {others.slice(0, 4).map((v) => (
                  <article key={v.id} className="video-card">
                    <YouTubeEmbed id={v.id} title={v.title} />
                    <h3>{v.title}</h3>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Par thématique</span>
              <h2>Explorer les vidéos.</h2>
            </div>
          </div>
          <VideoLibrary videos={library} themes={themes.docs.map((t) => ({ id: t.id, name: t.name }))} />
        </div>
      </section>

      <section className="section section-alt">
        <div className="container split" style={{ alignItems: 'start' }}>
          <div>
            <span className="eyebrow">La communauté</span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Les sujets qui vous intéressent.</h2>
            {!!page.communityTopics?.length && (
              <div className="choices" style={{ marginTop: 24 }}>
                {page.communityTopics.map((t) => (
                  <span key={t.id} className="tag tag-neutral" style={{ fontSize: '0.92rem', padding: '8px 14px' }}>
                    {t.topic}
                  </span>
                ))}
              </div>
            )}
            <p className="lead" style={{ marginTop: 28 }}>
              Une question, un bâtiment, une ville ou un thème que vous aimeriez voir analysé ? Proposez-le : les
              suggestions sont lues une à une.
            </p>
          </div>
          <div className="panel">
            <h3 style={{ fontSize: '1.5rem' }}>Proposer un sujet</h3>
            <SuggestionForm />
          </div>
        </div>
      </section>
    </>
  )
}
