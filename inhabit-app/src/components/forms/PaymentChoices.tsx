'use client'

import { startTransition, useActionState, useEffect, useState } from 'react'
import { startBookCheckout } from '@/app/(frontend)/actions'
import type { Provider } from '@/lib/payments/config'
import { initialState } from './FormParts'

export const PROVIDER_CHOICES: { value: Provider; label: string; hint: string }[] = [
  { value: 'stripe', label: 'Carte bancaire', hint: 'Visa, Mastercard, Apple Pay, Google Pay' },
  { value: 'paypal', label: 'PayPal', hint: 'Compte PayPal ou carte via PayPal' },
]

type Props = {
  editionId: string
  providers: Provider[]
  /** ex. « 29 € », « 29 € + 6 € de livraison » */
  priceLabel: string
  note?: string | null
}

/** Boutons « Carte bancaire » et « PayPal » sous une édition du livre. */
export function BookPayButtons({ editionId, providers, priceLabel, note }: Props) {
  const [state, dispatch, pending] = useActionState(startBookCheckout, initialState)
  const [clicked, setClicked] = useState<Provider | null>(null)
  const redirecting = state.ok && Boolean(state.redirect)

  useEffect(() => {
    if (state.ok && state.redirect) window.location.assign(state.redirect)
  }, [state])

  if (!providers.length) return null

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const fd = new FormData(e.currentTarget, submitter)
    setClicked(fd.get('provider') as Provider)
    startTransition(() => dispatch(fd))
  }

  const busy = pending || redirecting

  return (
    <form onSubmit={onSubmit} className="pay-online">
      <input type="hidden" name="edition" value={editionId} />
      <span className="pay-online-label">
        Payer en ligne · <strong>{priceLabel}</strong>
      </span>
      <div className="links">
        {PROVIDER_CHOICES.filter((c) => providers.includes(c.value)).map((c, i) => (
          <button
            key={c.value}
            type="submit"
            name="provider"
            value={c.value}
            className={`btn btn-sm ${i === 0 ? 'btn-accent' : 'btn-beige'}`}
            disabled={busy}
            aria-label={`Payer ${priceLabel} par ${c.label}`}
          >
            {busy && clicked === c.value ? 'Redirection…' : c.label}
          </button>
        ))}
      </div>
      {note && <small className="muted">{note}</small>}
      {!state.ok && state.message && (
        <p className="form-status ko" role="status" aria-live="polite">
          {state.message}
        </p>
      )}
    </form>
  )
}
