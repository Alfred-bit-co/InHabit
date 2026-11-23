/** Devises proposées dans l'admin pour les prix payables en ligne. */
export const CURRENCIES = [
  { label: 'Euro (€)', value: 'eur' },
  { label: 'Franc CFA BCEAO (FCFA)', value: 'xof' },
  { label: 'Dollar US ($)', value: 'usd' },
  { label: 'Yen (¥)', value: 'jpy' },
] as const

export type Currency = (typeof CURRENCIES)[number]['value']

export const isCurrency = (v: unknown): v is Currency => CURRENCIES.some((c) => c.value === v)

/** Devises sans centimes chez les prestataires de paiement (le montant s'envoie tel quel). */
const ZERO_DECIMAL = new Set(['xof', 'xaf', 'jpy', 'krw', 'clp', 'gnf', 'rwf', 'ugx', 'vnd', 'bif', 'djf', 'kmf', 'mga', 'pyg', 'vuv', 'xpf'])

/** 29 € → 2900 ; 15 000 FCFA → 15000. */
export const toMinorUnits = (amount: number, currency: string) =>
  ZERO_DECIMAL.has(currency.toLowerCase()) ? Math.round(amount) : Math.round(amount * 100)

/** 2900 (eur) → 29 */
export const fromMinorUnits = (minor: number, currency: string) =>
  ZERO_DECIMAL.has(currency.toLowerCase()) ? minor : minor / 100

/** Affichage « 29,00 € », « 15 000 F CFA »… */
export function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return ''
  const code = (currency || 'eur').toUpperCase()
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: ZERO_DECIMAL.has(code.toLowerCase()) ? 0 : 2,
    }).format(amount)
  } catch {
    return `${amount} ${code}`
  }
}
