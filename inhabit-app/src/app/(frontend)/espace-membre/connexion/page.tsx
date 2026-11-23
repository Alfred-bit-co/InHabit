import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LoginForm, RegisterForm } from '@/components/member/AuthForms'
import { AuthShell } from '@/components/member/AuthShell'
import { getMember, safeNext } from '@/lib/member'

export const metadata: Metadata = { title: 'Espace membre — connexion', robots: { index: false } }

type Params = { mode?: string; suite?: string; email?: string }

export default async function LoginPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams
  const next = safeNext(params.suite)
  if (await getMember()) redirect(next)

  const register = params.mode === 'inscription'
  const q = (mode?: string) =>
    `/espace-membre/connexion?${new URLSearchParams({ ...(mode ? { mode } : {}), ...(params.suite ? { suite: next } : {}) })}`

  return (
    <AuthShell>
      <div className="auth-tabs" role="tablist" aria-label="Connexion ou inscription">
        <Link href={q()} role="tab" aria-selected={!register} replace scroll={false}>
          Se connecter
        </Link>
        <Link href={q('inscription')} role="tab" aria-selected={register} replace scroll={false}>
          Créer un compte
        </Link>
      </div>
      {register ? (
        <>
          <h1 className="auth-title">Bienvenue.</h1>
          <p className="muted">
            Le compte est gratuit : il donne accès aux extraits offerts du livre, et à la lecture complète après
            achat.
          </p>
          <RegisterForm next={next} email={params.email} />
        </>
      ) : (
        <>
          <h1 className="auth-title">Bon retour.</h1>
          <p className="muted">Connectez-vous pour reprendre votre lecture.</p>
          <LoginForm next={next} email={params.email} />
        </>
      )}
    </AuthShell>
  )
}
