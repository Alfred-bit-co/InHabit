'use client'

import { submitContact } from '@/app/(frontend)/actions'
import { CONTACT_REASONS } from '@/lib/constants'
import { Field, Honeypot, Status, Submit, useFormAction } from './FormParts'

export function ContactForm({ defaultReason }: { defaultReason?: string }) {
  const { state, pending, ref, onSubmit } = useFormAction(submitContact)

  return (
    <form ref={ref} onSubmit={onSubmit} className="form" noValidate>
      <Honeypot />
      <Field name="reason" label="Motif de la demande *" state={state}>
        <select id="reason" name="reason" required defaultValue={defaultReason ?? ''}>
          <option value="" disabled>
            Choisissez un motif
          </option>
          {CONTACT_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="form-row">
        <Field name="name" label="Nom *" state={state}>
          <input id="name" name="name" required autoComplete="name" />
        </Field>
        <Field name="email" label="Email *" state={state}>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </Field>
      </div>
      <div className="form-row">
        <Field name="organization" label="Organisation" state={state}>
          <input id="organization" name="organization" autoComplete="organization" />
        </Field>
        <Field name="subject" label="Objet *" state={state}>
          <input id="subject" name="subject" required />
        </Field>
      </div>
      <Field name="message" label="Message *" state={state}>
        <textarea id="message" name="message" required rows={6} />
      </Field>
      <Status state={state} />
      <Submit pending={pending}>Envoyer le message</Submit>
    </form>
  )
}
