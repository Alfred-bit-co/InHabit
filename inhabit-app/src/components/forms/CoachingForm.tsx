'use client'

import { submitCoaching } from '@/app/(frontend)/actions'
import type { MonthAvailability } from '@/lib/availability'
import { Field, Honeypot, Status, Submit, useFormAction } from './FormParts'

const placesLabel = (m: MonthAvailability) =>
  m.full ? 'Complet' : m.displayed <= 1 ? 'Dernière place' : `${m.displayed} places restantes`

export function CoachingForm({ months }: { months: MonthAvailability[] }) {
  const { state, pending, ref, onSubmit } = useFormAction(submitCoaching)

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
      <Status state={state} />
      <Submit pending={pending}>Réserver ma place</Submit>
      <p className="form-note">
        Votre demande est confirmée par email après validation. Aucun paiement n’est demandé à cette étape.
      </p>
    </form>
  )
}
