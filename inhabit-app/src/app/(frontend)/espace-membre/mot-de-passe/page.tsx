import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotForm } from '@/components/member/AuthForms'
import { AuthShell } from '@/components/member/AuthShell'

export const metadata: Metadata = { title: 'Mot de passe oublié', robots: { index: false } }

export default function ForgotPage() {
  return (
    <AuthShell>
      <Link href="/espace-membre/connexion" className="back-link">
        ← Retour à la connexion
      </Link>
      <h1 className="auth-title">Mot de passe oublié.</h1>
      <p className="muted">Indiquez votre email : vous recevrez un lien pour en choisir un nouveau.</p>
      <ForgotForm />
    </AuthShell>
  )
}
