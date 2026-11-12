'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useActionState, useEffect, useRef } from 'react'
import type { FormState } from '@/app/(frontend)/actions'

export const initialState: FormState = { ok: false, message: '' }

/**
 * Envoie le formulaire à une action serveur sans le vider en cas d'erreur
 * (React 19 réinitialise sinon les champs après chaque envoi).
 * Le formulaire n'est vidé qu'en cas de succès.
 */
export function useFormAction(action: (state: FormState, fd: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, initialState)
  const ref = useRef<HTMLFormElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!state.ok) return
    ref.current?.reset()
    router.refresh() // met à jour les places / créneaux affichés
  }, [state, router])

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => dispatch(fd))
  }

  return { state, pending, ref, onSubmit }
}

type FieldProps = {
  name: string
  label: string
  state: FormState
  children: React.ReactNode
  hint?: string
}

/** Libellé + champ + message d'erreur éventuel. */
export function Field({ name, label, state, children, hint }: FieldProps) {
  const error = state.errors?.[name]
  return (
    <div className="field" data-invalid={error ? 'true' : undefined}>
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && !error && <p className="form-note">{hint}</p>}
      {error && (
        <span className="error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

/** Champ invisible : s'il est rempli, c'est un robot. */
export function Honeypot() {
  return (
    <div className="hp" aria-hidden="true">
      <label htmlFor="website">Ne pas remplir</label>
      <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  )
}

export function Submit({
  children,
  pending,
  className = 'btn btn-accent',
}: {
  children: React.ReactNode
  pending: boolean
  className?: string
}) {
  return (
    <button type="submit" className={className} disabled={pending} style={{ justifySelf: 'start' }}>
      {pending ? 'Envoi en cours…' : children}
    </button>
  )
}

export function Status({ state }: { state: FormState }) {
  if (!state.message) return null
  return (
    <p className={`form-status ${state.ok ? 'ok' : 'ko'}`} role="status" aria-live="polite">
      {state.message}
    </p>
  )
}
