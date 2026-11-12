'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Grand texte dont les mots s'allument au fil du défilement.
 * Les mots entre *astérisques* sont mis en italique couleur terre cuite.
 */
export function TextReveal({ text, as: Tag = 'p' }: { text: string; as?: 'p' | 'h2' }) {
  const ref = useRef<HTMLElement>(null)
  const words = text.split(/\s+/).filter(Boolean)
  const [lit, setLit] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLit(words.length)
      return
    }
    let id = 0
    const update = () => {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const start = vh * 0.88
      const end = vh * 0.3
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * 0.35)))
      setLit(Math.round(p * words.length))
    }
    const onScroll = () => {
      cancelAnimationFrame(id)
      id = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [words.length])

  return (
    <Tag ref={ref as never} className="statement" aria-label={text.replace(/\*/g, '')}>
      {words.map((w, i) => {
        const em = /^\*.*\*[.,;:!?]?$/.test(w)
        const clean = w.replace(/\*/g, '')
        return (
          <span key={i} aria-hidden="true">
            <span className={`w${i < lit ? ' on' : ''}${em ? ' em' : ''}`}>{clean}</span>{' '}
          </span>
        )
      })}
    </Tag>
  )
}
