/** Utilitaires de dates sans dépendance (format AAAA-MM-JJ / AAAA-MM). */

export const pad = (n: number) => String(n).padStart(2, '0')

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const toISOMonth = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`

/** Construit une date locale à partir de « AAAA-MM-JJ » (évite les décalages de fuseau). */
export const fromISODate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function formatDateFr(value?: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!value) return ''
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? fromISODate(value) : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-FR', opts ?? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export const formatShortDate = (value?: string | null) =>
  formatDateFr(value, { day: 'numeric', month: 'long', year: 'numeric' })

export function formatMonthFr(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return value ?? ''
  const [y, m] = value.split('-').map(Number)
  const s = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
