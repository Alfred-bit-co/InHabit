'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export type HeroSlide = {
  image: string
  alt: string
  title: string
  line1?: string | null
  line2?: string | null
  link?: string | null
}

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (slides.length < 2 || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % slides.length), 5500)
    return () => window.clearTimeout(t)
  }, [slides.length, paused, index])

  if (!slides.length) return null

  return (
    <div className="hero-card-wrap" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="hero-card" aria-roledescription="carrousel" aria-label="À la une">
        {slides.map((s, i) => {
          const content = (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt={s.alt} loading={i === 0 ? 'eager' : 'lazy'} />
              <div className="caption">
                <strong>{s.title}</strong>
                {s.line1 && <span>{s.line1}</span>}
                {s.line2 && <span>{s.line2}</span>}
                {s.link && (
                  <span className="go" aria-hidden="true">
                    →
                  </span>
                )}
              </div>
            </>
          )
          return (
            <div
              key={i}
              className={`slide${i === index ? ' active' : ''}`}
              aria-hidden={i !== index}
              role="group"
              aria-roledescription="diapositive"
              aria-label={`${i + 1} sur ${slides.length}`}
            >
              {s.link ? (
                <Link href={s.link} tabIndex={i === index ? 0 : -1} data-cursor="Ouvrir">
                  {content}
                </Link>
              ) : (
                content
              )}
            </div>
          )
        })}
      </div>
      {slides.length > 1 && (
        <div className={`dots${paused ? ' paused' : ''}`}>
          {slides.map((s, i) => (
            <button
              key={`${i}-${i === index ? index : 'x'}`}
              type="button"
              aria-label={`Afficher : ${s.title}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
