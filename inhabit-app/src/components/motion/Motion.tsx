'use client'

import Lenis from 'lenis'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Effets globaux du site public :
 * - défilement fluide (Lenis)
 * - apparition des éléments [data-reveal] quand ils entrent à l'écran
 * - curseur personnalisé (« Voir » sur les éléments [data-cursor])
 */
export function Motion() {
  const pathname = usePathname()
  const lenisRef = useRef<Lenis | null>(null)
  const cursorRef = useRef<HTMLDivElement>(null)

  // Défilement fluide
  useEffect(() => {
    if (reduced()) return
    const lenis = new Lenis({ lerp: 0.09, anchors: { offset: -110 } })
    lenisRef.current = lenis
    let id = 0
    const raf = (t: number) => {
      lenis.raf(t)
      id = requestAnimationFrame(raf)
    }
    id = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(id)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // À chaque changement de page : retour en haut + apparitions
  useEffect(() => {
    if (!window.location.hash) lenisRef.current?.scrollTo(0, { immediate: true })
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.in)')
    if (reduced() || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pathname])

  // Curseur
  useEffect(() => {
    const el = cursorRef.current
    if (!el || !window.matchMedia('(pointer: fine)').matches || reduced()) return
    let x = -100,
      y = -100,
      cx = -100,
      cy = -100,
      id = 0
    const move = (e: MouseEvent) => {
      x = e.clientX
      y = e.clientY
      el.classList.remove('hide')
    }
    const over = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor]')
      if (target) {
        el.textContent = target.dataset.cursor || 'Voir'
        el.classList.add('big')
      } else {
        el.classList.remove('big')
      }
    }
    const leave = () => el.classList.add('hide')
    const loop = () => {
      cx += (x - cx) * 0.2
      cy += (y - cy) * 0.2
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    window.addEventListener('mousemove', move)
    document.addEventListener('mouseover', over)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseover', over)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [])

  return <div ref={cursorRef} className="cursor hide" aria-hidden="true" />
}
