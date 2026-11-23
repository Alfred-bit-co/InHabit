'use client'

import { useFormStatus } from 'react-dom'

/** Bouton d'envoi d'un formulaire de paiement, désactivé pendant la redirection. */
export function PayButton({ children, className = 'btn btn-accent btn-sm' }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? 'Redirection…' : children}
    </button>
  )
}
