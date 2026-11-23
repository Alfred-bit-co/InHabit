'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'

export type BookCover = { src: string; alt: string; label: string }

/** Livre en 3D : les couvertures des éditions (FR, EN…) se remplacent en boucle. */
export function BookCover3D({ covers, interval = 4500 }: { covers: BookCover[]; interval?: number }) {
  const [active, setActive] = useState(0)

  // Un minuteur par couverture affichée : un clic sur une édition relance le décompte.
  useEffect(() => {
    if (covers.length < 2) return
    const id = window.setTimeout(() => setActive((i) => (i + 1) % covers.length), interval)
    return () => window.clearTimeout(id)
  }, [active, covers.length, interval])

  if (!covers.length) return null

  return (
    <div className="book-stage-inner">
      <div className="book-3d">
        {covers.map((c, i) => (
          <img
            key={c.src}
            src={c.src}
            alt={c.alt}
            aria-hidden={i !== active}
            className={i === active ? 'is-active' : undefined}
            loading={i === 0 ? undefined : 'lazy'}
          />
        ))}
      </div>
      {covers.length > 1 && (
        <div className="book-editions" role="group" aria-label="Éditions du livre">
          {covers.map((c, i) => (
            <button
              key={c.src}
              type="button"
              aria-pressed={i === active}
              onClick={() => setActive(i)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
