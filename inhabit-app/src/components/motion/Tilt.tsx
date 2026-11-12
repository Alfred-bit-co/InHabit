'use client'

import { useRef } from 'react'

/** Incline légèrement son contenu en 3D selon la position de la souris. */
export function Tilt({ children, max = 7, className = '' }: { children: React.ReactNode; max?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || !window.matchMedia('(pointer: fine)').matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(1200px) rotateY(${x * max}deg) rotateX(${-y * max}deg)`
  }
  const reset = () => {
    if (ref.current) ref.current.style.transform = 'perspective(1200px) rotateY(0) rotateX(0)'
  }

  return (
    <div ref={ref} className={`tilt ${className}`} onMouseMove={onMove} onMouseLeave={reset}>
      {children}
    </div>
  )
}
