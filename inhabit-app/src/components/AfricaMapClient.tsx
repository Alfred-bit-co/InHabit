'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useMemo, useState } from 'react'

export type MapProject = {
  slug: string
  title: string
  country: string
  countryName: string
  city?: string | null
  year?: string | null
  image?: string | null
}

type CountryPath = { code: string; name: string; d: string }

export function AfricaMapClient({
  paths,
  projects,
  width,
  height,
}: {
  paths: CountryPath[]
  projects: MapProject[]
  width: number
  height: number
}) {
  const byCountry = useMemo(() => {
    const map = new Map<string, MapProject[]>()
    for (const p of projects) map.set(p.country, [...(map.get(p.country) ?? []), p])
    return map
  }, [projects])

  const countries = useMemo(
    () =>
      [...byCountry.entries()]
        .map(([code, list]) => ({ code, name: list[0].countryName, count: list.length }))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [byCountry],
  )

  const [selected, setSelected] = useState<string | null>(countries[0]?.code ?? null)
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)

  const current = selected ? byCountry.get(selected) ?? [] : []
  const currentName = countries.find((c) => c.code === selected)?.name

  const onMove = (e: React.MouseEvent<SVGPathElement>, name: string, count: number) => {
    const box = (e.currentTarget.ownerSVGElement?.parentElement as HTMLElement).getBoundingClientRect()
    setTip({
      x: e.clientX - box.left,
      y: e.clientY - box.top,
      text: count ? `${name} — ${count} projet${count > 1 ? 's' : ''}` : name,
    })
  }

  return (
    <div className="map-layout">
      <div className="africa-map">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Carte des projets en Afrique">
          {paths.map((p) => {
            const count = byCountry.get(p.code)?.length ?? 0
            const cls = [count ? 'has' : '', selected === p.code ? 'selected' : ''].join(' ').trim()
            return (
              <path
                key={p.code}
                d={p.d}
                className={cls || undefined}
                tabIndex={count ? 0 : undefined}
                role={count ? 'button' : undefined}
                aria-label={count ? `${p.name} : ${count} projet${count > 1 ? 's' : ''}` : undefined}
                onClick={() => count && setSelected(p.code)}
                onKeyDown={(e) => {
                  if (count && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    setSelected(p.code)
                  }
                }}
                onMouseMove={(e) => onMove(e, p.name, count)}
                onMouseLeave={() => setTip(null)}
              />
            )
          })}
        </svg>
        {tip && (
          <div className="map-tooltip" style={{ left: tip.x, top: tip.y }}>
            {tip.text}
          </div>
        )}
        <div className="map-legend">
          <span>
            <i style={{ background: 'var(--stone)' }} /> Pays avec projets
          </span>
          <span>
            <i style={{ background: 'var(--accent)' }} /> Pays sélectionné
          </span>
        </div>
      </div>

      <div className="map-panel">
        {countries.length > 0 && (
          <div className="country-list filters" role="group" aria-label="Choisir un pays">
            {countries.map((c) => (
              <button
                key={c.code}
                type="button"
                aria-pressed={selected === c.code}
                onClick={() => setSelected(c.code)}
              >
                {c.name} ({c.count})
              </button>
            ))}
          </div>
        )}
        {currentName ? (
          <>
            <h3>{currentName}</h3>
            <div className="grid" style={{ gap: 12 }}>
              {current.map((p) => (
                <Link key={p.slug} href={`/projets/${p.slug}`} className="mini-project">
                  {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span />}
                  <div>
                    <strong>{p.title}</strong>
                    <span>{[p.city, p.year].filter(Boolean).join(' · ')}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p className="empty">Les projets apparaîtront ici dès qu’ils seront ajoutés depuis l’administration.</p>
        )}
      </div>
    </div>
  )
}
