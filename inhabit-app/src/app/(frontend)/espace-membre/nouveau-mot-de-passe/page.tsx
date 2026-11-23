import type { Metadata } from 'next'
import Link from 'next/link'
import { ResetForm } from '@/components/member/AuthForms'
import { AuthShell } from '@/components/member/AuthShell'

export const metadata: Metadata = { title: 'Nouveau mot de passe', robots: { index: false } }

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  return (
    <AuthShell>
      <h1 className="auth-title">Nouveau mot de passe.</h1>
      {token ? (
        <ResetForm token={token} />
      ) : (
        <p className="muted">
          Ce lien est incomplet. <Link href="/espace-membre/mot-de-passe">Refaire une demande</Link>.
        </p>
      )}
    </AuthShell>
  )
}
