'use client'

import { submitCoaching } from '@/app/(frontend)/actions'
import type { MonthAvailability } from '@/lib/availability'
import type { Provider } from '@/lib/payments/config'
import { PROVIDER_CHOICES } from './PaymentChoices'
import { Field, Honeypot, Status, Submit, useFormAction } from './FormParts'

const placesLabel = (m: MonthAvailability) =>
  m.full ? 'Complet' : m.displayed <= 1 ? 'Dernière place' : `${m.displayed} places restantes`

type Props = { months: MonthAvailability[]; providers?: Provider[]; priceLabel?: string; xofLabel?: string }

export function CoachingForm({ months, providers = [], priceLabel, xofLabel }: Props) {
  const { state, pending, ref, onSubmit } = useFormAction(submitCoaching)
  const payOnline = providers.length > 0
  const providerErr = state.errors?.provider
  const redirecting = state.ok && Boolean(state.redirect)

  if (!months.length) {
    return (
      <p className="empty">
        Aucune session n’est ouverte pour le moment. Revenez bientôt ou écrivez-nous via la page contact.
      </p>
    )
  }

  const err = state.errors?.month

  return (
    <form ref={ref} onSubmit={onSubmit} className="form" noValidate>
      <Honeypot />
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }} data-invalid={err ? 'true' : undefined}>
        <legend>Mois de l’accompagnement *</legend>
        <div className="choices" style={{ marginTop: 8 }}>
          {months.map((m) => (
            <label key={m.month} className="choice">
              <input type="radio" name="month" value={m.month} disabled={m.full} required />
              <span>
                <strong>{m.label}</strong>
                <small className={m.full ? 'full' : m.displayed <= 2 ? 'few' : undefined}>{placesLabel(m)}</small>
              </span>
            </label>
          ))}
        </div>
        {err && (
          <span className="error" role="alert">
            {err}
          </span>
        )}
      </fieldset>
      <div className="form-row">
        <Field name="name" label="Nom complet *" state={state}>
          <input id="name" name="name" required autoComplete="name" />
        </Field>
        <Field name="email" label="Email *" state={state}>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </Field>
      </div>
      <div className="form-row">
        <Field name="phone" label="Téléphone / WhatsApp" state={state}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" />
        </Field>
        <Field name="country" label="Pays de résidence" state={state}>
          <input id="country" name="country" autoComplete="country-name" />
        </Field>
      </div>
      <Field name="profile" label="Votre profil" state={state}>
        <select id="profile" name="profile" defaultValue="">
          <option value="">— Choisir —</option>
          <option value="etudiant">Étudiant·e en architecture</option>
          <option value="jeune-diplome">Jeune diplômé·e</option>
          <option value="professionnel">Architecte / professionnel·le</option>
          <option value="autre">Autre</option>
        </select>
      </Field>
      <Field name="motivation" label="Vos objectifs et votre motivation *" state={state}>
        <textarea id="motivation" name="motivation" rows={5} required />
      </Field>
      {payOnline && (
        <fieldset
          className="field"
          style={{ border: 0, padding: 0, margin: 0 }}
          data-invalid={providerErr ? 'true' : undefined}
        >
          <legend>Moyen de paiement *</legend>
          <div className="choices" style={{ marginTop: 8 }}>
            {PROVIDER_CHOICES.filter((c) => providers.includes(c.value)).map((c, i) => (
              <label key={c.value} className="choice">
                <input type="radio" name="provider" value={c.value} defaultChecked={i === 0} required />
                <span>
                  <strong>{c.label}</strong>
                  <small>{c.value === 'fedapay' && xofLabel ? `${xofLabel} · T-Money, Flooz, MTN, Wave, carte` : c.hint}</small>
                </span>
              </label>
            ))}
          </div>
          {providerErr && (
            <span className="error" role="alert">
              {providerErr}
            </span>
          )}
        </fieldset>
      )}
      <Status state={state} />
      {payOnline ? (
        <>
          <Submit pending={pending || redirecting} pendingLabel="Redirection vers le paiement…">
            Réserver et payer{priceLabel ? ` ${priceLabel}` : ''}
          </Submit>
          <p className="form-note">
            Paiement sécurisé par{' '}
            {providers.map((p) => (p === 'paypal' ? 'PayPal' : p === 'fedapay' ? 'FedaPay' : 'Stripe')).join(', ')} : vos
            coordonnées bancaires ne passent jamais par ce site. Votre place
            est bloquée 30 minutes, le temps du paiement, puis confirmée par email.
          </p>
        </>
      ) : (
        <>
          <Submit pending={pending}>Réserver ma place</Submit>
          <p className="form-note">
            Votre demande est confirmée par email après validation. Aucun paiement n’est demandé à cette étape.
          </p>
        </>
      )}
    </form>
  )
}
