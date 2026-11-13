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
  firstName: string
  fullName: string
  role: string
  photo: string | null
  today: string
  initials: string
  hero: { src: string | null; title: string; href: string } | null
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
  }
  requests: Req[]
}

const A = '/admin'
const col = (slug: string) => `${A}/collections/${slug}`
const glob = (slug: string) => `${A}/globals/${slug}`

/* ───────────── Icônes (trait fin, comme sur le site) ───────────── */

const paths = {
  plus: <path d="M12 5v14M5 12h14" />,
  arrowUR: <path d="M7 17 17 7M8 7h9v9" />,
  arrowR: <path d="M5 12h14m-6-6 6 6-6 6" />,
  up: <path d="M12 19V5m-6 6 6-6 6 6" />,
  down: <path d="M12 5v14m6-6-6 6-6-6" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
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
  play: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="3.5" />
      <path d="m10.5 9.5 4 2.5-4 2.5Z" />
    </>
  ),
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
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4" />
    </>
  ),
  layout: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M3.5 9.5h17M9.5 9.5v11" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
} satisfies Record<string, React.ReactNode>

type IconName = keyof typeof paths

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
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
        <Icon name={up ? 'up' : 'down'} size={12} /> {Math.abs(value)} %
      </span>{' '}
      {label}
    </p>
  )
}

function Bars({ data }: { data: DashData['kpi']['bars'] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="ih-bars" role="img" aria-label="Rendez-vous par mois">
      {data.map((d, i) => (
        <div key={d.label} className="ih-bar-col" title={`${d.label} : ${d.value} rendez-vous`}>
          <em>{d.value || ''}</em>
          <div
            className={`ih-bar${d.current ? ' strong' : ''}`}
            style={{ height: `${Math.max(6, (d.value / max) * 100)}%`, animationDelay: `${i * 60}ms` }}
          />
          <span>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ───────────── Menu « Publier » ───────────── */

const publishItems: { label: string; href: string; icon: IconName }[] = [
  { label: 'Une actualité', href: `${col('news')}/create`, icon: 'doc' },
  { label: 'Un projet', href: `${col('projects')}/create`, icon: 'layout' },
  { label: 'Une vidéo YouTube', href: `${col('videos')}/create`, icon: 'play' },
  { label: 'Un concours / événement', href: `${col('events')}/create`, icon: 'trophy' },
  { label: 'Une publication', href: `${col('publications')}/create`, icon: 'book' },
]

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
      <button type="button" className="ih-btn ih-btn-dark" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Icon name="plus" size={16} /> Publier
      </button>
      {open && (
        <div className="ih-menu" role="menu">
          {publishItems.map((it) => (
            <a key={it.href} href={it.href} role="menuitem">
              <Icon name={it.icon} size={16} />
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
  { label: 'Tableau de bord', href: A, active: true },
  { label: 'Actualités', href: col('news') },
  { label: 'Projets', href: col('projects') },
  { label: 'Vidéos', href: col('videos') },
  { label: 'Livre', href: glob('book') },
  { label: 'Accompagnement', href: glob('coaching') },
  { label: 'Rendez-vous', href: glob('appointment-settings') },
  { label: 'Pages', href: glob('home') },
]

const kinds = [
  { value: 'all', label: 'Tous les types' },
  { value: 'rdv', label: 'Rendez-vous' },
  { value: 'coaching', label: 'Accompagnement' },
  { value: 'message', label: 'Messages' },
  { value: 'suggestion', label: 'Suggestions YouTube' },
]

const kindIcon: Record<Req['kind'], IconName> = { rdv: 'calendar', coaching: 'book', message: 'mail', suggestion: 'play' }

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('') || '?'

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`

export function DashboardClient({ data }: { data: DashData }) {
  const router = useRouter()
  const { kpi, requests, content } = data

  const [tab, setTab] = useState<'all' | 'pending' | 'rdv'>('all')
  const [kind, setKind] = useState('all')
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
      if (s && !`${r.name} ${r.email} ${r.value} ${r.tiles.map((t) => t.value).join(' ')}`.toLowerCase().includes(s))
        return false
      return true
    })
  }, [requests, tab, kind, search])

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

  // Détails de la demande : cases + pied, sans doublons
  const details = current
    ? [...current.tiles, ...current.footer].filter(
        (d, i, all) => all.findIndex((x) => x.label === d.label) === i && d.value && d.value !== '—',
      )
    : []

  const contentRows: { label: string; count: number; href: string; icon: IconName }[] = [
    { label: 'Actualités', count: content.news, href: col('news'), icon: 'doc' },
    { label: 'Projets', count: content.projects, href: col('projects'), icon: 'layout' },
    { label: 'Vidéos', count: content.videos, href: col('videos'), icon: 'play' },
    { label: 'Concours & événements', count: content.events, href: col('events'), icon: 'trophy' },
    { label: 'Recherches & publications', count: content.publications, href: col('publications'), icon: 'book' },
  ]

  return (
    <div className="ih-dash">
      {/* ── Barre du haut ── */}
      <header className="ih-top">
        <a href={A} className="ih-brand" aria-label="Tableau de bord InHabit">
          <span className="ih-logo-in">In</span>
          <span className="ih-brand-name">Habit</span>
          <small>Espace admin</small>
        </a>

        <nav className="ih-pills" aria-label="Sections de l’admin">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className={n.active ? 'active' : undefined} aria-current={n.active ? 'page' : undefined}>
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ih-tools">
          <a href="/" target="_blank" rel="noreferrer" className="ih-icon-btn" title="Voir le site" aria-label="Voir le site">
            <Icon name="globe" />
          </a>
          <a href={col('media')} className="ih-icon-btn" title="Médiathèque" aria-label="Médiathèque">
            <Icon name="image" />
          </a>
          <a href="#demandes" className="ih-icon-btn ih-bell" title="Demandes à traiter" aria-label={`${pendingCount} demandes à traiter`}>
            <Icon name="bell" />
            {pendingCount > 0 && <i>{pendingCount}</i>}
          </a>
          <a href={glob('site-settings')} className="ih-icon-btn" title="Réglages du site" aria-label="Réglages du site">
            <Icon name="gear" />
          </a>
          <a href={`${A}/account`} className="ih-avatar" title="Mon compte" aria-label="Mon compte">
            {data.photo ? <img src={data.photo} alt="" /> : data.initials}
          </a>
        </div>
      </header>

      {/* ── Accueil : bienvenue, image, profil ── */}
      <section className="ih-hero">
        <div className="ih-welcome">
          <p className="ih-date">{data.today}</p>
          <h1>
            Bienvenue <span>{data.firstName}</span>
          </h1>
          <p className="ih-lead">
            {kpi.toHandle > 0
              ? `${plural(kpi.toHandle, 'demande attend', 'demandes attendent')} votre réponse. Tout le reste est à jour.`
              : 'Toutes les demandes ont été traitées. Bonne journée de création.'}
          </p>
          <div className="ih-actions">
            <PublishMenu />
            <a href="#demandes" className="ih-btn ih-btn-line">
              Voir les demandes <Icon name="arrowR" size={16} />
            </a>
          </div>

          <dl className="ih-stats">
            <a href="#demandes">
              <dt>Demandes à traiter</dt>
              <dd>{kpi.toHandle}</dd>
              <Trend value={kpi.weekTrend} label="sur 7 jours" />
            </a>
            <a href={col('appointments')}>
              <dt>Rendez-vous à venir</dt>
              <dd>{kpi.upcoming}</dd>
              <Trend value={kpi.apptTrend} label="vs mois dernier" />
            </a>
            <a href={col('contact-messages')}>
              <dt>Messages (30 j)</dt>
              <dd>{kpi.last30}</dd>
              <Trend value={kpi.inboundTrend} label="vs 30 j précédents" />
            </a>
          </dl>
        </div>

        {data.hero?.src ? (
          <a className="ih-visual" href={data.hero.href}>
            <img src={data.hero.src} alt="" />
            <span className="ih-visual-tag">
              <small>Projet à la une</small>
              <strong>{data.hero.title}</strong>
            </span>
            <span className="ih-visual-go" aria-hidden="true">
              <Icon name="arrowUR" size={16} />
            </span>
          </a>
        ) : (
          <div className="ih-visual ih-visual-empty" />
        )}

        <aside className="ih-profile" aria-label="Profil">
          <div className="ih-photo">
            {data.photo ? <img src={data.photo} alt={data.fullName} /> : <span>{data.initials}</span>}
          </div>
          <strong>{data.fullName}</strong>
          <small>{data.role}</small>
          <div className="ih-profile-links">
            <a href={glob('youtube-page')} title="Page YouTube" aria-label="Page YouTube">
              <Icon name="play" size={17} />
            </a>
            <a href={glob('book')} title="Livre CONCEPT" aria-label="Livre CONCEPT">
              <Icon name="book" size={17} />
            </a>
            <a href={`${A}/account`} title="Mon compte" aria-label="Mon compte">
              <Icon name="user" size={17} />
            </a>
          </div>
          <a href={glob('about')} className="ih-btn ih-btn-dark ih-btn-block">
            Modifier mon profil
          </a>
        </aside>
      </section>

      {/* ── Trois cartes ── */}
      <section className="ih-cards">
        <a className="ih-card" href={col('appointments')}>
          <div className="ih-card-head">
            <h2>Rendez-vous</h2>
            <span className="ih-corner" aria-hidden="true">
              <Icon name="arrowUR" size={15} />
            </span>
          </div>
          <p className="ih-value">
            {kpi.upcoming} <small>à venir</small>
          </p>
          <Bars data={kpi.bars} />
        </a>

        <div className="ih-card">
          <div className="ih-card-head">
            <h2>Accompagnement CONCEPT</h2>
            {kpi.price && <span className="ih-chip">{kpi.price}</span>}
            <a href={glob('coaching')} className="ih-corner" aria-label="Gérer les mois et les places">
              <Icon name="arrowUR" size={15} />
            </a>
          </div>
          <p className="ih-value">
            {kpi.months[0]?.displayed ?? 0} <small>{(kpi.months[0]?.displayed ?? 0) > 1 ? 'places affichées' : 'place affichée'}</small>
          </p>
          <div className="ih-months">
            {kpi.months.length === 0 && <p className="ih-muted">Aucun mois ouvert pour l’instant.</p>}
            {kpi.months.map((m, i) => (
              <a key={m.month} href={glob('coaching')} className={`ih-month${i === 0 ? ' on' : ''}${m.full ? ' full' : ''}`}>
                <strong>{m.short}</strong>
                <span className="ih-month-dots" aria-hidden="true">
                  {Array.from({ length: Math.min(6, m.capacity) }, (_, k) => (
                    <i key={k} className={k < m.capacity - m.remaining ? 'taken' : undefined} />
                  ))}
                </span>
                <small>{m.full ? 'Complet' : `${m.remaining}/${m.capacity} libres`}</small>
              </a>
            ))}
          </div>
          <a href={col('coaching-bookings')} className="ih-link">
            Voir les réservations <Icon name="arrowR" size={15} />
          </a>
        </div>

        <div className="ih-card">
          <div className="ih-card-head">
            <h2>Contenus du site</h2>
          </div>
          <ul className="ih-rows">
            {contentRows.map((r) => (
              <li key={r.href}>
                <a href={r.href}>
                  <span className="ih-row-ico">
                    <Icon name={r.icon} size={16} />
                  </span>
                  <span>{r.label}</span>
                  <b>{r.count}</b>
                  <Icon name="arrowR" size={15} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Demandes reçues ── */}
      <section className="ih-inbox" id="demandes" aria-label="Demandes reçues">
        <div className="ih-inbox-head">
          <h2>Demandes reçues</h2>
          <div className="ih-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>
              Toutes <span>{requests.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={tab === 'pending'} onClick={() => setTab('pending')}>
              À traiter <span>{pendingCount}</span>
            </button>
            <button type="button" role="tab" aria-selected={tab === 'rdv'} onClick={() => setTab('rdv')}>
              Rendez-vous <span>{rdvCount}</span>
            </button>
          </div>
          <div className="ih-filters">
            <label className="ih-field">
              <span className="sr">Type de demande</span>
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                {kinds.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
              <Icon name="chevron" size={15} />
            </label>
            <label className="ih-field ih-search">
              <Icon name="search" size={16} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                aria-label="Rechercher une demande"
              />
            </label>
          </div>
        </div>

        <div className="ih-inbox-body">
          {filtered.length === 0 ? (
            <p className="ih-empty">Aucune demande ne correspond.</p>
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
                    <span className="ih-av">{initialsOf(r.name)}</span>
                    <span className="ih-who">
                      <strong>{r.name}</strong>
                      <small>
                        <Icon name={kindIcon[r.kind]} size={13} /> {r.title} · {r.when}
                      </small>
                    </span>
                    <span className={`ih-status${r.pending ? ' hot' : ''}`}>{r.statusLabel}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="ih-detail" aria-live="polite">
            {current && (
              <>
                <div className="ih-detail-head">
                  <span className="ih-av lg">{initialsOf(current.name)}</span>
                  <div>
                    <small>{current.kindLabel}</small>
                    <h3>{current.name}</h3>
                    {current.email && <a href={`mailto:${current.email}`}>{current.email}</a>}
                  </div>
                  <span className={`ih-status${current.pending ? ' hot' : ''}`}>{current.statusLabel}</span>
                </div>

                <dl className="ih-facts">
                  {details.map((d) => (
                    <div key={d.label}>
                      <dt>{d.label}</dt>
                      <dd>{d.value}</dd>
                    </div>
                  ))}
                </dl>

                {current.text && <blockquote className="ih-text">{current.text}</blockquote>}

                <div className="ih-detail-actions">
                  <a href={`${col(current.collection)}/${current.id}`} className="ih-btn ih-btn-line">
                    <Icon name="open" size={16} /> Ouvrir la fiche
                  </a>
                  {current.email && (
                    <a href={`mailto:${current.email}`} className="ih-btn ih-btn-line">
                      <Icon name="mail" size={16} /> Répondre
                    </a>
                  )}
                  {current.action ? (
                    <button
                      type="button"
                      className="ih-btn ih-btn-accent"
                      disabled={busy}
                      onClick={() => updateStatus(current, current.action!.status)}
                    >
                      {busy ? 'Enregistrement…' : current.action.label}
                    </button>
                  ) : (
                    <span className="ih-btn ih-btn-done">
                      <Icon name="check" size={16} /> Traitée
                    </span>
                  )}
                </div>
                {error && <p className="ih-error">{error}</p>}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
