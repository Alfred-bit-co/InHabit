'use client'

import { submitSuggestion } from '@/app/(frontend)/actions'
import { Field, Honeypot, Status, Submit, useFormAction } from './FormParts'

export function SuggestionForm() {
  const { state, pending, ref, onSubmit } = useFormAction(submitSuggestion)

  return (
    <form ref={ref} onSubmit={onSubmit} className="form" noValidate>
      <Honeypot />
      <Field name="topic" label="Quel sujet aimeriez-vous voir traité ? *" state={state}>
        <input id="topic" name="topic" required placeholder="Ex. : l’architecture en terre au Sahel" />
      </Field>
      <Field name="details" label="Pourquoi ce sujet ? (optionnel)" state={state}>
        <textarea id="details" name="details" rows={4} />
      </Field>
      <div className="form-row">
        <Field name="name" label="Nom ou pseudo" state={state}>
          <input id="name" name="name" autoComplete="nickname" />
        </Field>
        <Field name="email" label="Email (pour vous prévenir)" state={state}>
          <input id="email" name="email" type="email" autoComplete="email" />
        </Field>
      </div>
      <Status state={state} />
      <Submit pending={pending}>Proposer ce sujet</Submit>
    </form>
  )
}
