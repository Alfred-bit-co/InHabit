import type { AppointmentSetting, Coaching } from '@/payload-types'
import { formatMonthFr, toISODate, toISOMonth } from './dates'

export type DayAvailability = { date: string; slots: string[] }

const blockedDay = (value: string) => (value.length >= 10 ? value.slice(0, 10) : value)

/**
 * Jours et créneaux encore libres pour les rendez-vous.
 * `booked` contient les clés « AAAA-MM-JJ HH:MM » déjà réservées.
 */
export function computeAvailability(
  settings: AppointmentSetting,
  booked: Set<string>,
  now = new Date(),
): DayAvailability[] {
  const weekdays = new Set((settings.weekdays ?? []).map(String))
  const slots = (settings.slots ?? []).map((s) => s.time).filter(Boolean).sort()
  const blocked = new Set((settings.blockedDates ?? []).map((b) => blockedDay(String(b.date))))
  const minNotice = settings.minNoticeDays ?? 1
  const daysAhead = settings.daysAhead ?? 30

  const days: DayAvailability[] = []
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  for (let i = minNotice; i <= daysAhead; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const iso = toISODate(d)
    if (!weekdays.has(String(d.getDay())) || blocked.has(iso)) continue
    const free = slots.filter((t) => !booked.has(`${iso} ${t}`))
    if (free.length) days.push({ date: iso, slots: free })
  }
  return days
}

export type MonthAvailability = {
  month: string
  label: string
  remaining: number
  displayed: number
  full: boolean
}

/**
 * Places de l'accompagnement par mois.
 * Le nombre affiché peut être plus bas que la capacité, jamais plus haut que les places réelles.
 */
export function computeMonths(
  coaching: Coaching,
  counts: Record<string, number>,
  now = new Date(),
): MonthAvailability[] {
  const current = toISOMonth(now)
  return (coaching.months ?? [])
    .filter((m) => m.open !== false && m.month >= current)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => {
      const remaining = Math.max(0, (m.capacity ?? 0) - (counts[m.month] ?? 0))
      const shown = m.displayedPlaces ?? null
      const displayed = shown === null ? remaining : Math.min(shown, remaining)
      return { month: m.month, label: formatMonthFr(m.month), remaining, displayed, full: remaining <= 0 }
    })
}
