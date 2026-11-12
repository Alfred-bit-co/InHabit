'use client'

import { useState } from 'react'
import { ytThumb } from '@/lib/youtube'

/** Lecteur YouTube léger : l'iframe ne se charge qu'au clic (plus rapide, moins de cookies). */
export function YouTubeEmbed({ id, title, maxres = false }: { id: string; title: string; maxres?: boolean }) {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="video-frame">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`Lire la vidéo : ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ytThumb(id, maxres ? 'maxres' : 'hq')} alt="" loading="lazy" />
          <span className="play" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
