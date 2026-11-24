import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LoginForm, RegisterForm } from '@/components/member/AuthForms'
import { AuthShell } from '@/components/member/AuthShell'
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

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
