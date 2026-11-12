'use client'

import { useEffect, useRef, useState } from 'react'

/** Chiffre qui défile de 0 à sa valeur quand il apparaît (ex. « 31K+ », « 20+ »). */
export function CountUp({ value }: { value: string }) {
  const m = value.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/)
  const target = m ? parseFloat(m[2].replace(',', '.')) : 0
  const decimals = m && /[.,]/.test(m[2]) ? 1 : 0
  const [n, setN] = useState(target)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!m || !el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setN(0)
    let id = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / 1800)
        setN(target * (1 - Math.pow(1 - p, 4)))
        if (p < 1) id = requestAnimationFrame(tick)
      }
      id = requestAnimationFrame(tick)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  if (!m) return <strong>{value}</strong>
  return (
    <strong ref={ref} aria-label={value}>
      {m[1]}
      {n.toFixed(decimals)}
      {m[3]}
    </strong>
  )
}
