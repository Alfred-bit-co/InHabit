'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  changePassword,
  forgotPasswordMember,
  loginMember,
  registerMember,
  resetPasswordMember,
  updateProfile,
} from '@/app/(frontend)/espace-membre/actions'
import { Field, Honeypot, Status, Submit, useFormAction } from '@/components/forms/FormParts'

/** Champ mot de passe avec bouton « afficher ». */
function PasswordInput({ id, name, autoComplete }: { id: string; name: string; autoComplete: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="pw-input">
      <input id={id} name={name} type={show ? 'text' : 'password'} required autoComplete={autoComplete} minLength={name === 'current' ? undefined : 8} />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
        {show ? 'Masquer' : 'Afficher'}
      </button>
    </div>
  )
}

export function LoginForm({ next, email }: { next: string; email?: string }) {
  const { state, pending, ref, onSubmit } = useFormAction(loginMember)
  return (
    <form ref={ref} onSubmit={onSubmit} className="form" noValidate>
      <input type="hidden" name="suite" value={next} />
      <Field name="email" label="Email" state={state}>
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={email} />
      </Field>
      <Field name="password" label="Mot de passe" state={state}>
        <PasswordInput id="password" name="password" autoComplete="current-password" />
      </Field>
      <Status state={state} />
      <div className="auth-actions">
        <Submit pending={pending}>Me connecter</Submit>
        <Link href="/espace-membre/mot-de-passe" className="link-arrow">
          Mot de passe oublié ?
        </Link>
      </div>
    </form>
  )
}

export function RegisterForm({ next, email }: { next: string; email?: string }) {
  const { state, pending, ref, onSubmit } = useFormAction(registerMember)
  const consentErr = state.errors?.consent
  return (
    <form ref={ref} onSubmit={onSubmit} className="form" noValidate>
      <Honeypot />
      <input type="hidden" name="suite" value={next} />
      <Field name="name" label="Nom complet" state={state}>
        <input id="name" name="name" required autoComplete="name" />
      </Field>
      <Field name="email" label="Email" state={state}>
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={email} />
      </Field>
      <Field name="password" label="Mot de passe (8 caractères minimum)" state={state}>
        <PasswordInput id="password" name="password" autoComplete="new-password" />
      </Field>
      <div className="field" data-invalid={consentErr ? 'true' : undefined}>
        <label className="check">
          <input type="checkbox" name="consent" value="1" required />
          <span>
            J’accepte la{' '}
            <Link href="/confidentialite" target="_blank">
              politique de confidentialité
            </Link>
            .
          </span>
        </label>
        {consentErr && (
          <span className="error" role="alert">
            {consentErr}
          </span>
        )}
      </div>
      <Status state={state} />
      <Submit pending={pending}>Créer mon compte</Submit>
    </form>
  )
}

export function ForgotForm() {
  const { state, pending, ref, onSubmit } = useFormAction(forgotPasswordMember)
  return (
    <form ref={ref} onSubmit={onSubmit} className="form" noValidate>
      <Field name="email" label="Email du compte" state={state}>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </Field>
      <Status state={state} />
      <Submit pending={pending}>Recevoir le lien</Submit>
    </form>
  )
}

export function ResetForm({ token }: { token: string }) {
  const { state, pending, ref, onSubmit } = useFormAction(resetPasswordMember)
  return (
    <form ref={ref} onSubmit={onSubmit} className="form" noValidate>
      <input type="hidden" name="token" value={token} />
      <Field name="password" label="Nouveau mot de passe (8 caractères minimum)" state={state}>
        <PasswordInput id="password" name="password" autoComplete="new-password" />
      </Field>
      <Status state={state} />
      <Submit pending={pending}>Enregistrer et me connecter</Submit>
    </form>
  )
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const { state, pending, onSubmit } = useFormAction(updateProfile)
  return (
    <form onSubmit={onSubmit} className="form" noValidate>
      <div className="form-row">
        <Field name="name" label="Nom" state={state}>
          <input id="name" name="name" required autoComplete="name" defaultValue={name} />
        </Field>
        <div className="field">
          <label htmlFor="email-ro">Email</label>
          <input id="email-ro" value={email} readOnly disabled />
        </div>
      </div>
      <Status state={state} />
      <Submit pending={pending} className="btn btn-dark btn-sm">
        Enregistrer
      </Submit>
    </form>
  )
}

export function PasswordForm() {
  const { state, pending, ref, onSubmit } = useFormAction(changePassword)
  return (
    <form ref={ref} onSubmit={onSubmit} className="form" noValidate>
      <div className="form-row">
        <Field name="current" label="Mot de passe actuel" state={state}>
          <PasswordInput id="current" name="current" autoComplete="current-password" />
        </Field>
        <Field name="password" label="Nouveau mot de passe" state={state}>
          <PasswordInput id="password" name="password" autoComplete="new-password" />
        </Field>
      </div>
      <Status state={state} />
      <Submit pending={pending} className="btn btn-dark btn-sm">
        Changer le mot de passe
      </Submit>
    </form>
  )
}
