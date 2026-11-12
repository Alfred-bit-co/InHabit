'use client'

import { useMemo, useState } from 'react'
import type { YtVideo } from '@/lib/youtube'
import { formatShortDate } from '@/lib/dates'
import { YouTubeEmbed } from './YouTubeEmbed'

/** Vidéos classées par thématique, avec filtre. */
export function VideoLibrary({
  videos,
  themes,
}: {
  videos: YtVideo[]
  themes: { id: number; name: string }[]
}) {
  const [active, setActive] = useState<number | null>(null)
  const list = useMemo(
    () => (active === null ? videos : videos.filter((v) => v.themes?.some((t) => t.id === active))),
    [videos, active],
  )

  if (!videos.length) {
    return <p className="empty">Les vidéos classées par thème apparaîtront ici.</p>
  }

  return (
    <>
      {themes.length > 0 && (
        <div className="filters" role="group" aria-label="Filtrer par thématique">
          <button type="button" aria-pressed={active === null} onClick={() => setActive(null)}>
            Toutes
          </button>
          {themes.map((t) => (
            <button key={t.id} type="button" aria-pressed={active === t.id} onClick={() => setActive(t.id)}>
              {t.name}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-3">
        {list.map((v) => (
          <article key={v.id} className="video-card">
            <YouTubeEmbed id={v.id} title={v.title} />
            <h3>{v.title}</h3>
            <p>
              {v.themes?.map((t) => t.name).join(' · ')}
              {v.themes?.length && v.publishedAt ? ' — ' : ''}
              {v.publishedAt && formatShortDate(v.publishedAt)}
            </p>
          </article>
        ))}
      </div>
      {!list.length && <p className="empty">Aucune vidéo dans cette thématique pour le moment.</p>}
    </>
  )
}
