import Link from 'next/link'
import type { SiteSetting } from '@/payload-types'
import { Socials } from './Socials'

export function Footer({ settings }: { settings: SiteSetting }) {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-cta">
          <h2>
            Construisons quelque chose de <em>juste</em>.
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/produits/rendez-vous" className="btn btn-beige">
              Prendre rendez-vous <span className="arrow">→</span>
            </Link>
            <Link href="/a-propos#contact" className="btn btn-ghost" style={{ color: 'var(--paper)', boxShadow: 'inset 0 0 0 1px rgba(250,247,242,.3)' }}>
              Écrire un message
            </Link>
          </div>
        </div>

        <div className="footer-grid">
          <div>
            <Link href="/" className="logo" aria-label="InHabit — accueil">
              <span className="logo-in">In</span>
              <span>Habit</span>
            </Link>
            <p style={{ marginTop: 18, maxWidth: '38ch' }}>{settings.tagline}</p>
            <Socials settings={settings} />
          </div>
          <div>
            <h4>Explorer</h4>
            <ul>
              <li><Link href="/youtube">YouTube</Link></li>
              <li><Link href="/projets">Projets</Link></li>
              <li><Link href="/projets/recherche">Recherche & publications</Link></li>
              <li><Link href="/projets/concours">Concours & événements</Link></li>
              <li><Link href="/actualites">Actualités</Link></li>
            </ul>
          </div>
          <div>
            <h4>Produits & services</h4>
            <ul>
              <li><Link href="/produits/livre-concept">Livre CONCEPT</Link></li>
              <li><Link href="/produits/accompagnement">Accompagnement CONCEPT</Link></li>
              <li><Link href="/produits/rendez-vous">Rendez-vous gratuit</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              {settings.contactEmail && (
                <li><a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></li>
              )}
              {settings.phone && <li>{settings.phone}</li>}
              {settings.location && <li>{settings.location}</li>}
              <li><Link href="/a-propos?motif=partenariat#contact">Proposer un partenariat</Link></li>
            </ul>
          </div>
        </div>

        <p className="footer-word" aria-hidden="true">
          In<em>Habit</em>
        </p>

        <div className="footer-bottom">
          <span>© {year} {settings.siteName || 'InHabit_Archi'}. Tous droits réservés.</span>
          <nav aria-label="Informations légales">
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/confidentialite">Confidentialité</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
