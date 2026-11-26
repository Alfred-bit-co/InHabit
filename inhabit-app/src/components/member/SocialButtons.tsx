import type { ReactNode } from 'react'
import { AppleLogo, FacebookLogo, GoogleLogo, XLogo } from './SocialLogos'

const SOON: { name: string; logo: ReactNode }[] = [
  { name: 'Apple', logo: <AppleLogo /> },
  { name: 'Facebook', logo: <FacebookLogo /> },
  { name: 'X', logo: <XLogo /> },
]

/**
 * Rangée des boutons de connexion sociale : Google (actif) puis Apple, Facebook
 * et X (affichés, mais pas encore branchés). Google est toujours présent : si
 * ses clés manquent, la route /espace-membre/google renvoie vers le message
 * « google-indisponible ».
 */
export function SocialButtons({ next, googleLabel }: { next: string; googleLabel: string }) {
  return (
    <div className="social-wrap">
      <div className="social-row">
        <a
          href={`/espace-membre/google?${new URLSearchParams({ suite: next })}`}
          className="social-btn"
          aria-label={googleLabel}
        >
          <GoogleLogo />
          <span className="social-name">Google</span>
        </a>
        {SOON.map(({ name, logo }) => (
          <button
            key={name}
            type="button"
            className="social-btn"
            aria-disabled="true"
            aria-label={`Continuer avec ${name} (bientôt disponible)`}
            title="Bientôt disponible"
          >
            {logo}
            <span className="social-name">{name}</span>
            <span className="social-soon">Bientôt</span>
          </button>
        ))}
      </div>
    </div>
  )
}
