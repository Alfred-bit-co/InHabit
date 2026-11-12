import type { Payload } from 'payload'
import React from 'react'
import type { Coaching } from '@/payload-types'
import { computeMonths } from '@/lib/availability'
import { formatMonthFr, toISODate, toISOMonth } from '@/lib/dates'
import { CONTACT_REASONS } from '@/lib/constants'
import { DashboardClient, type DashData, type Req } from './DashboardClient'

/* Tableau de bord de l'admin : chiffres clés, graphiques et demandes reçues. */

type Props = { payload: Payload; user?: { name?: string | null; email?: string | null } | null }

const DAY = 86_400_000

const labels = {
  coaching: { nouvelle: 'À traiter', confirmee: 'Confirmée', annulee: 'Annulée' },
  appointments: { confirme: 'Confirmé', effectue: 'Effectué', annule: 'Annulé' },
  messages: { nouveau: 'Nouveau', 'en-cours': 'En cours', traite: 'Traité' },
  suggestions: { nouveau: 'Nouvelle', retenu: 'Retenue', traite: 'En vidéo', ecarte: 'Écartée' },
} as const

const formats: Record<string, string> = { visio: 'Visio', telephone: 'Téléphone' }
const profiles: Record<string, string> = {
  etudiant: 'Étudiant·e',
  'jeune-diplome': 'Jeune diplômé·e',
  professionnel: 'Professionnel·le',
  autre: 'Autre',
}
const projectTypes: Record<string, string> = {
  maison: 'Maison individuelle',
  logements: 'Logements',
  equipement: 'Équipement',
  renovation: 'Rénovation',
  autre: 'Autre',
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

const dayDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function relative(target: Date, now: Date, future = false) {
  const days = Math.round((target.getTime() - new Date(now.toDateString()).getTime()) / DAY)
  if (future) {
    if (days === 0) return 'Aujourd’hui'
    if (days === 1) return 'Demain'
    if (days > 1) return `Dans ${days} jours`
    return `Il y a ${-days} jours`
  }
  const ago = Math.floor((now.getTime() - target.getTime()) / DAY)
  if (ago <= 0) return 'Aujourd’hui'
  if (ago === 1) return 'Hier'
  return `Il y a ${ago} jours`
}

const monthShort = (ym: string) => {
  const [y, m] = ym.split('-').map(Number)
  const s = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const shiftMonth = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1)

const pct = (now: number, before: number) =>
  before === 0 ? (now > 0 ? 100 : 0) : Math.round(((now - before) / before) * 100)

export async function Dashboard({ payload, user }: Props) {
  const now = new Date()
  const today = toISODate(now)
  const q = { limit: 500, depth: 0, pagination: false, overrideAccess: true } as const

  const [coaching, appointments, messages, suggestions, coachingGlobal, project, counts] = await Promise.all([
    payload.find({ collection: 'coaching-bookings', sort: '-createdAt', ...q }),
    payload.find({ collection: 'appointments', sort: '-createdAt', ...q }),
    payload.find({ collection: 'contact-messages', sort: '-createdAt', ...q }),
    payload.find({ collection: 'topic-suggestions', sort: '-createdAt', ...q }),
    payload.findGlobal({ slug: 'coaching', depth: 0 }) as Promise<Coaching>,
    payload.find({ collection: 'projects', sort: '-featured', limit: 1, depth: 1, overrideAccess: true }),
    Promise.all(
      (['news', 'projects', 'videos', 'events', 'publications'] as const).map((c) =>
        payload.count({ collection: c, overrideAccess: true }).then((r) => r.totalDocs),
      ),
    ),
  ])

  /* ── Demandes reçues, toutes collections confondues ── */
  const reqs: Req[] = []

  for (const d of appointments.docs) {
    const date = dayDate(d.date)
    const upcoming = d.status === 'confirme' && d.date >= today
    reqs.push({
      key: `appointments-${d.id}`,
      id: d.id,
      collection: 'appointments',
      kind: 'rdv',
      kindLabel: 'Rendez-vous architectural',
      title: 'Rendez-vous',
      name: d.name,
      email: d.email,
      status: d.status,
      statusLabel: labels.appointments[d.status as keyof typeof labels.appointments] ?? d.status,
      pending: upcoming,
      createdAt: d.createdAt,
      when: relative(date, now, true),
      value: `${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '')} · ${d.slot}`,
      tiles: [
        { label: 'Date', value: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) },
        { label: 'Heure', value: d.slot },
        { label: formats[d.mode ?? ''] ? 'Format' : 'Projet', value: formats[d.mode ?? ''] ?? projectTypes[d.projectType ?? ''] ?? '—' },
      ],
      text: d.description,
      footer: [
        { label: 'Type de projet', value: projectTypes[d.projectType ?? ''] ?? '—' },
        { label: 'Localisation', value: d.location || '—' },
        { label: 'Téléphone', value: d.phone || '—' },
      ],
      action: d.status === 'confirme' ? { status: 'effectue', label: 'Marquer effectué' } : undefined,
    })
  }

  for (const d of coaching.docs) {
    reqs.push({
      key: `coaching-bookings-${d.id}`,
      id: d.id,
      collection: 'coaching-bookings',
      kind: 'coaching',
      kindLabel: 'Accompagnement CONCEPT',
      title: 'Réservation',
      name: d.name,
      email: d.email,
      status: d.status,
      statusLabel: labels.coaching[d.status as keyof typeof labels.coaching] ?? d.status,
      pending: d.status === 'nouvelle',
      createdAt: d.createdAt,
      when: relative(new Date(d.createdAt), now),
      value: formatMonthFr(d.month),
      tiles: [
        { label: 'Mois choisi', value: formatMonthFr(d.month) },
        { label: 'Profil', value: profiles[d.profile ?? ''] ?? '—' },
        { label: 'Pays', value: d.country || '—' },
      ],
      text: d.motivation,
      footer: [
        { label: 'Téléphone', value: d.phone || '—' },
        { label: 'Reçue le', value: shortDate(d.createdAt) },
        { label: 'Tarif', value: coachingGlobal.price || '—' },
      ],
      action: d.status === 'nouvelle' ? { status: 'confirmee', label: 'Confirmer la place' } : undefined,
    })
  }

  for (const d of messages.docs) {
    const reason = CONTACT_REASONS.find((r) => r.value === d.reason)?.label ?? d.reason
    reqs.push({
      key: `contact-messages-${d.id}`,
      id: d.id,
      collection: 'contact-messages',
      kind: 'message',
      kindLabel: 'Message de contact',
      title: 'Message',
      name: d.name,
      email: d.email,
      status: d.status,
      statusLabel: labels.messages[d.status as keyof typeof labels.messages] ?? d.status,
      pending: d.status !== 'traite',
      createdAt: d.createdAt,
      when: relative(new Date(d.createdAt), now),
      value: reason.split(' (')[0],
      tiles: [
        { label: 'Motif', value: reason.split(' (')[0] },
        { label: 'Objet', value: d.subject },
        { label: 'Organisation', value: d.organization || '—' },
      ],
      text: d.message,
      footer: [
        { label: 'Email', value: d.email },
        { label: 'Reçu le', value: shortDate(d.createdAt) },
        { label: 'Statut', value: labels.messages[d.status as keyof typeof labels.messages] ?? d.status },
      ],
      action: d.status !== 'traite' ? { status: 'traite', label: 'Marquer traité' } : undefined,
    })
  }

  for (const d of suggestions.docs) {
    reqs.push({
      key: `topic-suggestions-${d.id}`,
      id: d.id,
      collection: 'topic-suggestions',
      kind: 'suggestion',
      kindLabel: 'Suggestion de sujet YouTube',
      title: 'Suggestion',
      name: d.name || 'Anonyme',
      email: d.email || '',
      status: d.status,
      statusLabel: labels.suggestions[d.status as keyof typeof labels.suggestions] ?? d.status,
      pending: d.status === 'nouveau',
      createdAt: d.createdAt,
      when: relative(new Date(d.createdAt), now),
      value: 'Sujet YouTube',
      tiles: [
        { label: 'Sujet proposé', value: d.topic },
        { label: 'Proposé par', value: d.name || 'Anonyme' },
        { label: 'Reçue le', value: shortDate(d.createdAt) },
      ],
      text: d.details,
      footer: [
        { label: 'Email', value: d.email || '—' },
        { label: 'Reçue le', value: shortDate(d.createdAt) },
        { label: 'Statut', value: labels.suggestions[d.status as keyof typeof labels.suggestions] ?? d.status },
      ],
      action: d.status === 'nouveau' ? { status: 'retenu', label: 'Retenir le sujet' } : undefined,
    })
  }

  // À traiter d'abord, puis les plus récentes
  reqs.sort((a, b) => Number(b.pending) - Number(a.pending) || b.createdAt.localeCompare(a.createdAt))

  /* ── Carte 1 : demandes à traiter ── */
  const toHandle = reqs.filter((r) => r.pending && r.kind !== 'rdv').length
  const weekAgo = now.getTime() - 7 * DAY
  const twoWeeksAgo = now.getTime() - 14 * DAY
  const thisWeek = reqs.filter((r) => new Date(r.createdAt).getTime() >= weekAgo).length
  const lastWeek = reqs.filter((r) => {
    const t = new Date(r.createdAt).getTime()
    return t >= twoWeeksAgo && t < weekAgo
  }).length

  /* ── Carte 2 : rendez-vous par mois ── */
  const live = appointments.docs.filter((a) => a.status !== 'annule')
  const bars = Array.from({ length: 6 }, (_, i) => {
    const ym = toISOMonth(shiftMonth(now, i - 2))
    return { label: monthShort(ym), value: live.filter((a) => a.date.startsWith(ym)).length, current: i === 2 }
  })
  const upcoming = live.filter((a) => a.status === 'confirme' && a.date >= today).length
  const thisMonth = toISOMonth(now)
  const prevMonth = toISOMonth(shiftMonth(now, -1))
  const apptNow = live.filter((a) => a.date.startsWith(thisMonth)).length
  const apptPrev = live.filter((a) => a.date.startsWith(prevMonth)).length

  /* ── Carte 3 : messages et suggestions par semaine ── */
  const inbound = [...messages.docs, ...suggestions.docs].map((d) => new Date(d.createdAt).getTime())
  const line = Array.from({ length: 8 }, (_, i) => {
    const end = now.getTime() - (7 - i) * 7 * DAY
    return inbound.filter((t) => t > end - 7 * DAY && t <= end).length
  })
  const last30 = inbound.filter((t) => t >= now.getTime() - 30 * DAY).length
  const prev30 = inbound.filter((t) => t < now.getTime() - 30 * DAY && t >= now.getTime() - 60 * DAY).length

  /* ── Carte 4 : places de l'accompagnement ── */
  const booked: Record<string, number> = {}
  for (const b of coaching.docs) if (b.status !== 'annulee') booked[b.month] = (booked[b.month] ?? 0) + 1
  const months = computeMonths(coachingGlobal, booked, now)
    .slice(0, 3)
    .map((m) => ({
      ...m,
      short: monthShort(m.month),
      capacity: coachingGlobal.months?.find((x) => x.month === m.month)?.capacity ?? 0,
    }))

  const cover = project.docs[0]?.cover
  const illustration =
    cover && typeof cover === 'object' ? cover.sizes?.card?.url || cover.url || null : null

  const data: DashData = {
    userName: user?.name || user?.email?.split('@')[0] || 'Admin',
    initials: (user?.name || user?.email || 'A')
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]!.toUpperCase())
      .join(''),
    content: {
      news: counts[0],
      projects: counts[1],
      videos: counts[2],
      events: counts[3],
      publications: counts[4],
    },
    kpi: {
      toHandle,
      thisWeek,
      weekTrend: pct(thisWeek, lastWeek),
      upcoming,
      apptTrend: pct(apptNow, apptPrev),
      bars,
      last30,
      inboundTrend: pct(last30, prev30),
      line,
      months,
      price: coachingGlobal.price || null,
      illustration,
    },
    requests: reqs,
  }

  return <DashboardClient data={data} />
}

export default Dashboard
