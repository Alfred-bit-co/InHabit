'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'

export type Req = {
  key: string
  id: number | string
  collection: 'appointments' | 'coaching-bookings' | 'contact-messages' | 'topic-suggestions'
  kind: 'rdv' | 'coaching' | 'message' | 'suggestion'
  kindLabel: string
  title: string
  name: string
  email: string
  status: string
  statusLabel: string
  pending: boolean
  createdAt: string
  when: string
  value: string
  tiles: { label: string; value: string }[]
  text?: string | null
  footer: { label: string; value: string }[]
  action?: { status: string; label: string }
}

export type DashData = {
  userName: string
  initials: string
  content: { news: number; projects: number; videos: number; events: number; publications: number }
  kpi: {
    toHandle: number
    thisWeek: number
    weekTrend: number
    upcoming: number
    apptTrend: number
    bars: { label: string; value: number; current: boolean }[]
    last30: number
    inboundTrend: number
    line: number[]
    months: { month: string; label: string; short: string; displayed: number; remaining: number; capacity: number; full: boolean }[]
    price: string | null
    illustration: string | null
  }
  requests: Req[]
}

const A = '/admin'
const col = (slug: string) => `${A}/collections/${slug}`
const glob = (slug: string) => `${A}/globals/${slug}`

/* ───────────── Icônes ───────────── */

const paths: Record<string, React.ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  arrowL: <path d="M19 12H5m6-6-6 6 6 6" />,
  arrowUR: <path d="M7 17 17 7M8 7h9v9" />,
  up: <path d="M12 19V5m-6 6 6-6 6 6" />,
  down: <path d="M12 5v14m6-6-6 6-6-6" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  seat: (
    <>
      <rect x="3.5" y="6" width="17" height="13" rx="3" />
      <path d="M3.5 10.5h17M8 15h3" />
    </>
  ),
  sliders: <path d="M4 7h10m4 0h2M4 17h4m4 0h8M14 4v6M8 14v6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  bell: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15Z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m20.5 16-5-5-8 8.5" />
    </>
  ),
  book: <path d="M5 4.5h10a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3Zm0 12a3 3 0 0 1 3-3h10" />,
  doc: (
    <>
      <path d="M7 3.5h7l4 4v13H7Z" />
      <path d="M14 3.5v4h4M10 12h5M10 16h5" />
    </>
  ),
  trophy: <path d="M8 4h8v5a4 4 0 0 1-8 0Zm0 1.5H5a3 3 0 0 0 3 4m8-4h3a3 3 0 0 1-3 4M12 13v4m-3.5 3.5h7" />,
  bulb: <path d="M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9S14.5 18.4 12 21c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3Z" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </>
  ),
  open: <path d="M14 4h6v6m0-6-9 9M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V7.5A1.5 1.5 0 0 1 5.5 6H10" />,
  dots: (
    <>
      <circle cx="12" cy="5.5" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="12" cy="18.5" r="1.4" />
    </>
  ),
  layout: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M3.5 9.5h17M9.5 9.5v11" />
    </>
  ),
}

function Icon({ name, size = 18 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function Trend({ value, label }: { value: number; label: string }) {
  const up = value >= 0
  return (
    <p className="ih-trend">
      <span className={up ? 'up' : 'down'}>
        <Icon name={up ? 'up' : 'down'} size={13} /> {Math.abs(value)} %
      </span>{' '}
      {label}
    </p>
  )
}

/* ───────────── Graphiques ───────────── */

function Bars({ data }: { data: DashData['kpi']['bars'] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="ih-bars" role="img" aria-label="Rendez-vous par mois">
      {data.map((d, i) => (
        <div key={d.label} className="ih-bar-col" title={`${d.label} : ${d.value} rendez-vous`}>
          <div
            className={`ih-bar${i === data.length - 1 || d.current ? ' strong' : ''}`}
            style={{ height: `${Math.max(10, (d.value / max) * 100)}%`, animationDelay: `${i * 70}ms` }}
          />
          <span>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function Line({ data }: { data: number[] }) {
  const w = 220
  const h = 86
  const max = Math.max(1, ...data)
  const pts = data.map((v, i) => [8 + (i * (w - 16)) / (data.length - 1), h - 10 - (v / max) * (h - 26)] as const)
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  return (
    <svg className="ih-line" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Messages reçus par semaine">
      <defs>
        <linearGradient id="ih-line-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--ih-accent)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--ih-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${pts.at(-1)![0]},${h} L${pts[0][0]},${h} Z`} fill="url(#ih-line-fill)" />
      <path d={d} fill="none" stroke="var(--ih-accent)" strokeWidth="2" strokeLinejoin="round" pathLength={1} className="ih-line-stroke" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.2" fill="#fff" stroke="var(--ih-accent)" strokeWidth="2">
          <title>{`${data[i]} message(s)`}</title>
        </circle>
      ))}
    </svg>
  )
}

/* ───────────── Menu « Publier » ───────────── */

const publishItems = [
  { label: 'Une actualité', href: `${col('news')}/create`, icon: 'doc' },
  { label: 'Un projet', href: `${col('projects')}/create`, icon: 'layout' },
  { label: 'Une vidéo YouTube', href: `${col('videos')}/create`, icon: 'image' },
  { label: 'Un concours / événement', href: `${col('events')}/create`, icon: 'trophy' },
  { label: 'Une publication', href: `${col('publications')}/create`, icon: 'book' },
] as const

function PublishMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])
  return (
    <div className="ih-publish" ref={ref}>
      <button type="button" className="ih-btn-primary" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Icon name="plus" /> Publier du contenu
      </button>
      {open && (
        <div className="ih-menu" role="menu">
          {publishItems.map((it) => (
            <a key={it.href} href={it.href} role="menuitem">
              <span className="ih-menu-ico">
                <Icon name={it.icon} size={16} />
              </span>
              {it.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

/* ───────────── Tableau de bord ───────────── */

const nav = [
  { label: 'Vue d’ensemble', href: A, active: true },
  { label: 'Actualités', href: col('news') },
  { label: 'Projets', href: col('projects') },
  { label: 'Vidéos', href: col('videos') },
  { label: 'Livre', href: glob('book') },
  { label: 'Accompagnement', href: glob('coaching') },
  { label: 'Rendez-vous', href: glob('appointment-settings') },
  { label: 'Pages', href: glob('home') },
]

const tools = [
  { label: 'Médiathèque', href: col('media'), icon: 'image' },
  { label: 'Recherches & publications', href: col('publications'), icon: 'book' },
  { label: 'Concours & événements', href: col('events'), icon: 'trophy' },
  { label: 'Suggestions de sujets', href: col('topic-suggestions'), icon: 'bulb' },
  { label: 'Voir le site', href: '/', icon: 'globe', external: true },
] as const

const kinds = [
  { value: 'all', label: 'Toutes les demandes' },
  { value: 'rdv', label: 'Rendez-vous' },
  { value: 'coaching', label: 'Accompagnement' },
  { value: 'message', label: 'Messages de contact' },
  { value: 'suggestion', label: 'Suggestions YouTube' },
]

const tone: Record<string, string> = { rdv: 'a', coaching: 'b', message: 'c', suggestion: 'd' }

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('') || '?'

export function DashboardClient({ data }: { data: DashData }) {
  const router = useRouter()
  const { kpi, requests } = data

  const [tab, setTab] = useState<'all' | 'rdv' | 'pending'>('all')
  const [kind, setKind] = useState('all')
  const [state, setState] = useState<'all' | 'pending' | 'done'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(requests[0]?.key ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return requests.filter((r) => {
      if (tab === 'rdv' && r.kind !== 'rdv') return false
      if (tab === 'pending' && !r.pending) return false
      if (kind !== 'all' && r.kind !== kind) return false
      if (state === 'pending' && !r.pending) return false
      if (state === 'done' && r.pending) return false
      const day = r.createdAt.slice(0, 10)
      if (from && day < from) return false
      if (to && day > to) return false
      if (s && !`${r.name} ${r.email} ${r.value} ${r.tiles.map((t) => t.value).join(' ')}`.toLowerCase().includes(s))
        return false
      return true
    })
  }, [requests, tab, kind, state, from, to, search])

  const activeFilters = [kind !== 'all', state !== 'all', Boolean(from), Boolean(to), Boolean(search.trim())].filter(Boolean).length
  const current = filtered.find((r) => r.key === selected) ?? filtered[0] ?? null
  const pendingCount = requests.filter((r) => r.pending).length
  const rdvCount = requests.filter((r) => r.kind === 'rdv').length

  async function updateStatus(r: Req, status: string) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/${r.collection}/${r.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      setError('La mise à jour a échoué. Réessayez.')
    } finally {
      setBusy(false)
    }
  }

  const resetFilters = () => {
    setKind('all')
    setState('all')
    setFrom('')
    setTo('')
    setSearch('')
  }

  const next = kpi.months[0]

  return (
    <div className="ih-dash">
      {/* ── Barre du haut ── */}
      <header className="ih-top">
        <a href={A} className="ih-brand" aria-label="Tableau de bord">
          <span className="ih-brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span className="ih-brand-text">
            <strong>
              In<em>Habit</em>
            </strong>
            <small>Architecture, livre &amp; projets</small>
          </span>
        </a>

        <a href="#demandes" className="ih-count" title="Demandes à traiter">
          {pendingCount}
        </a>

        <nav className="ih-pills" aria-label="Sections de l’admin">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className={n.active ? 'active' : undefined} aria-current={n.active ? 'page' : undefined}>
              {n.active && <Icon name="plus" size={13} />}
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ih-tools">
          {tools.map((t) => (
            <a
              key={t.href}
              href={t.href}
              className="ih-icon-btn"
              title={t.label}
              aria-label={t.label}
              {...('external' in t ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              <Icon name={t.icon} />
            </a>
          ))}
          <span className="ih-sep" />
          <a href="#demandes" className="ih-icon-btn ih-bell" title="Demandes à traiter" aria-label={`${pendingCount} demandes à traiter`}>
            <Icon name="bell" />
            {pendingCount > 0 && <i />}
          </a>
          <a href={glob('site-settings')} className="ih-icon-btn" title="Réglages du site" aria-label="Réglages du site">
            <Icon name="gear" />
          </a>
          <a href={`${A}/account`} className="ih-avatar" title="Mon compte" aria-label="Mon compte">
            {data.initials}
          </a>
        </div>
      </header>

      {/* ── Titre ── */}
      <div className="ih-head">
        <a href="/" className="ih-round" aria-label="Retour au site" target="_blank" rel="noreferrer">
          <Icon name="arrowL" />
        </a>
        <div className="ih-head-text">
          <h1>Tableau de bord</h1>
          <p>
            Bonjour {data.userName} — gérez vos contenus et toutes les demandes reçues en un seul endroit.{' '}
            <span className="ih-content-line">
              {data.content.news} actualités · {data.content.projects} projets · {data.content.videos} vidéos ·{' '}
              {data.content.events} événements
            </span>
          </p>
        </div>
        <div className="ih-head-actions">
          <a href="#filtres" className="ih-round" title="Filtrer les demandes" aria-label="Filtrer les demandes">
            <Icon name="sliders" />
          </a>
          <PublishMenu />
        </div>
      </div>

      {/* ── Cartes ── */}
      <section className="ih-kpis">
        <a className="ih-card ih-card-illu" href="#demandes">
          <div className="ih-card-head">
            <h2>Demandes à traiter</h2>
            <span className="ih-ico red">
              <Icon name="alert" />
            </span>
          </div>
          <p className="ih-value">{kpi.toHandle}</p>
          <Trend value={kpi.weekTrend} label={`${kpi.thisWeek} reçue(s) cette semaine`} />
          <div className="ih-illu">
            {kpi.illustration ? <img src={kpi.illustration} alt="" /> : <div className="ih-illu-ph" />}
          </div>
        </a>

        <a className="ih-card" href={col('appointments')}>
          <div className="ih-card-head">
            <h2>Rendez-vous à venir</h2>
            <span className="ih-ico violet">
              <Icon name="calendar" />
            </span>
          </div>
          <p className="ih-value">{kpi.upcoming}</p>
          <Trend value={kpi.apptTrend} label="par rapport au mois dernier" />
          <Bars data={kpi.bars} />
        </a>

        <a className="ih-card" href={col('contact-messages')}>
          <div className="ih-card-head">
            <h2>Messages reçus (30 jours)</h2>
            <span className="ih-ico blue">
              <Icon name="clock" />
            </span>
          </div>
          <p className="ih-value">
            {kpi.last30} <small>messages</small>
          </p>
          <Trend value={kpi.inboundTrend} label="contacts et suggestions" />
          <Line data={kpi.line} />
        </a>

        <div className="ih-card ih-card-seats">
          <div className="ih-card-head">
            <h2>Accompagnement CONCEPT</h2>
            <span className="ih-ico green">
              <Icon name="seat" />
            </span>
            <a href={glob('coaching')} className="ih-corner" aria-label="Gérer les mois et les places">
              <Icon name="arrowUR" />
            </a>
          </div>
          <div className="ih-seat-row">
            <p className="ih-value">
              {next ? next.displayed : 0} <small>place{next && next.displayed > 1 ? 's' : ''} affichée{next && next.displayed > 1 ? 's' : ''}</small>
            </p>
            {kpi.price && <span className="ih-chip">{kpi.price}</span>}
          </div>
          <div className="ih-months">
            {kpi.months.length === 0 && <p className="ih-empty-small">Aucun mois ouvert. Ajoutez-en dans Accompagnement.</p>}
            {kpi.months.map((m, i) => (
              <a key={m.month} href={glob('coaching')} className={`ih-month${i === 0 ? ' on' : ''}${m.full ? ' full' : ''}`}>
                <span className="ih-month-dots" aria-hidden="true">
                  {Array.from({ length: Math.min(6, m.capacity) }, (_, k) => (
                    <i key={k} className={k < m.capacity - m.remaining ? 'taken' : undefined} />
                  ))}
                </span>
                <strong>{m.short}</strong>
                <small>{m.full ? 'Complet' : `${m.remaining}/${m.capacity} libres`}</small>
              </a>
            ))}
            <a href={col('coaching-bookings')} className="ih-dark-btn">
              Réservations
            </a>
          </div>
        </div>
      </section>

      {/* ── Filtres ── */}
      <section className="ih-filters" id="filtres" aria-label="Filtres des demandes">
        <p className="ih-filters-title">
          Filtres actifs <span>{activeFilters}</span>
          {activeFilters > 0 && (
            <button type="button" onClick={resetFilters} className="ih-reset">
              Effacer
            </button>
          )}
        </p>
        <label className="ih-field">
          <span className="sr">Type de demande</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {kinds.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
          <Icon name="chevron" size={16} />
        </label>
        <label className="ih-field">
          <span className="sr">Statut</span>
          <select value={state} onChange={(e) => setState(e.target.value as typeof state)}>
            <option value="all">Tous les statuts</option>
            <option value="pending">À traiter / à venir</option>
            <option value="done">Traités</option>
          </select>
          <Icon name="chevron" size={16} />
        </label>
        <label className="ih-field ih-date">
          <span>Du</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Reçues à partir du" />
        </label>
        <label className="ih-field ih-date">
          <span>Au</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Reçues jusqu’au" />
        </label>
        <label className="ih-field ih-search">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, email, sujet…"
            aria-label="Rechercher une demande"
          />
          <Icon name="search" />
        </label>
      </section>

      {/* ── Demandes ── */}
      <section className="ih-board" id="demandes" aria-label="Demandes reçues">
        <div className="ih-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>
            Toutes
          </button>
          <button type="button" role="tab" aria-selected={tab === 'rdv'} onClick={() => setTab('rdv')}>
            Rendez-vous <span>{rdvCount}</span>
          </button>
          <button type="button" role="tab" aria-selected={tab === 'pending'} onClick={() => setTab('pending')}>
            À traiter <span>{pendingCount}</span>
          </button>
        </div>
        <div className="ih-board-tools">
          <a href={col('contact-messages')} className="ih-ghost-ico" title="Tous les messages" aria-label="Tous les messages">
            <Icon name="layout" />
          </a>
          <a href={col('appointments')} className="ih-ghost-ico" title="Tous les rendez-vous" aria-label="Tous les rendez-vous">
            <Icon name="dots" />
          </a>
        </div>

        <div className="ih-list-wrap">
          <h2>Demandes reçues</h2>
          {filtered.length === 0 ? (
            <p className="ih-empty">Aucune demande ne correspond à ces filtres.</p>
          ) : (
            <ul className="ih-list">
              {filtered.slice(0, 40).map((r) => (
                <li key={r.key}>
                  <button
                    type="button"
                    className={current?.key === r.key ? 'on' : undefined}
                    onClick={() => setSelected(r.key)}
                    aria-pressed={current?.key === r.key}
                  >
                    <span className={`ih-av t-${tone[r.kind]}`}>{initialsOf(r.name)}</span>
                    <span className="ih-who">
                      <strong>
                        {r.title} · {r.name}
                      </strong>
                      <small>{r.when}</small>
                    </span>
                    <span className={`ih-status${r.pending ? ' hot' : ''}`}>{r.statusLabel}</span>
                    <span className="ih-amount">{r.value}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="ih-detail" aria-live="polite">
          {!current ? (
            <p className="ih-empty light">Sélectionnez une demande pour voir le détail.</p>
          ) : (
            <>
              <div className="ih-detail-head">
                <div>
                  <small>Détails de la demande</small>
                  <p className="ih-detail-title">
                    # {current.title}
                    <span className="ih-status">{current.statusLabel}</span>
                  </p>
                </div>
                <div>
                  <small>Type</small>
                  <p className="ih-detail-kind">{current.kindLabel}</p>
                </div>
                <div>
                  <small>Contact</small>
                  <p className="ih-person">
                    <span className={`ih-av t-${tone[current.kind]}`}>{initialsOf(current.name)}</span>
                    <span>
                      <strong>{current.name}</strong>
                      <em>{current.email || 'Pas d’email'}</em>
                    </span>
                  </p>
                </div>
              </div>

              <div className="ih-tiles">
                {current.tiles.map((t) => (
                  <div key={t.label} className="ih-tile">
                    <p>{t.value || '—'}</p>
                    <small>{t.label}</small>
                    <Icon name="arrowUR" size={16} />
                  </div>
                ))}
                <a href={`${col(current.collection)}/${current.id}`} className="ih-tile ih-tile-add">
                  <Icon name="open" />
                  <span>Ouvrir la fiche</span>
                </a>
              </div>

              {current.text && <p className="ih-text">{current.text}</p>}

              <div className="ih-detail-foot">
                {current.footer.map((f) => (
                  <div key={f.label}>
                    <small>{f.label}</small>
                    <p>{f.value}</p>
                  </div>
                ))}
                <div className="ih-foot-actions">
                  {current.email && (
                    <a
                      href={`mailto:${current.email}`}
                      className="ih-round light"
                      title="Répondre par email"
                      aria-label="Répondre par email"
                    >
                      <Icon name="mail" />
                    </a>
                  )}
                  <a
                    href={current.kind === 'rdv' ? glob('appointment-settings') : `${col(current.collection)}/${current.id}`}
                    className="ih-round light"
                    title={current.kind === 'rdv' ? 'Disponibilités' : 'Modifier'}
                    aria-label={current.kind === 'rdv' ? 'Disponibilités' : 'Modifier'}
                  >
                    <Icon name="calendar" />
                  </a>
                  {current.action ? (
                    <button
                      type="button"
                      className="ih-btn-white"
                      disabled={busy}
                      onClick={() => updateStatus(current, current.action!.status)}
                    >
                      {busy ? 'Enregistrement…' : current.action.label}
                    </button>
                  ) : (
                    <span className="ih-btn-white done">Traitée</span>
                  )}
                </div>
              </div>
              {error && <p className="ih-error">{error}</p>}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
