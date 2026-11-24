import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LoginForm, RegisterForm } from '@/components/member/AuthForms'
import { AuthShell } from '@/components/member/AuthShell'
import { GoogleLogo } from '@/components/member/GoogleLogo'
import { googleEnabled } from '@/lib/google'
import { getMember, safeNext } from '@/lib/member'

export const metadata: Metadata = { title: 'Espace membre — connexion', robots: { index: false } }

type Params = { mode?: string; suite?: string; email?: string; erreur?: string }

const GOOGLE_ERRORS: Record<string, string> = {
  google: 'La connexion avec Google n’a pas abouti. Réessayez, ou utilisez votre email.',
  'google-annule': 'Connexion avec Google annulée.',
  'google-indisponible': 'La connexion avec Google n’est pas encore disponible. Utilisez votre email.',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams
  const next = safeNext(params.suite)
  if (await getMember()) redirect(next)

  const register = params.mode === 'inscription'
  const google = googleEnabled()
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
      {params.erreur && GOOGLE_ERRORS[params.erreur] && (
        <p className="form-status ko" role="status" style={{ marginTop: 16 }}>
          {GOOGLE_ERRORS[params.erreur]}
        </p>
      )}
      {register ? (
        <>
          <h1 className="auth-title">Bienvenue.</h1>
          <p className="muted">
            Créez votre compte, puis choisissez votre abonnement : l’espace membre et la lecture du livre s’ouvrent dès
            que le paiement est confirmé.
          </p>
          {google && <GoogleButton next={next} label="Créer mon compte avec Google" />}
          <RegisterForm next={next} email={params.email} />
        </>
      ) : (
        <>
          <h1 className="auth-title">Bon retour.</h1>
          <p className="muted">Connectez-vous pour reprendre votre lecture.</p>
          {google && <GoogleButton next={next} label="Continuer avec Google" />}
          <LoginForm next={next} email={params.email} />
        </>
      )}
    </AuthShell>
  )
}

/** Bouton Google (simple lien : la suite se passe côté serveur). */
function GoogleButton({ next, label }: { next: string; label: string }) {
  return (
    <div className="auth-google">
      <a href={`/espace-membre/google?${new URLSearchParams({ suite: next })}`} className="btn btn-google">
        <GoogleLogo /> {label}
      </a>
      <p className="form-note" style={{ margin: 0 }}>
        En continuant avec Google, vous acceptez la <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
      <span className="auth-or">ou avec votre email</span>
    </div>
  )
}
