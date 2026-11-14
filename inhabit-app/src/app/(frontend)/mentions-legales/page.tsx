import type { Metadata } from 'next'
import { getSettings } from '@/lib/payload'

export const metadata: Metadata = { title: 'Mentions légales', robots: { index: false } }

export default async function LegalPage() {
  const settings = await getSettings()
  return (
    <section className="section-tight">
      <div className="container prose">
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}>Mentions légales</h1>
        <p className="muted">Dernière mise à jour : 14 novembre 2026</p>

        <h2>1. Éditeur du site</h2>
        <p>
          Le site {settings.siteName || 'InHabit_Archi'} est édité par Warren Riad AYITOU, architecte. Contact :{' '}
          ayitouw@gmail.com · +81 70-9045-6866.
        </p>

        <h2>2. Directeur de la publication</h2>
        <p>Warren Riad AYITOU.</p>

        <h2>3. Conception et développement</h2>
        <p>Site conçu et développé par Alfred AYITOU — alfredayitou@gmail.com.</p>

        <h2>4. Hébergement</h2>
        <p>
          Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis. Les données (base
          de données et images) sont hébergées par Supabase, sur des serveurs situés à Paris (France).
        </p>

        <h2>5. Propriété intellectuelle</h2>
        <p>
          L’ensemble des contenus présents sur ce site (textes, images, plans, illustrations, vidéos, logo, identité
          visuelle, extraits du livre CONCEPT) est protégé par le droit d’auteur et reste la propriété exclusive de
          Warren Riad AYITOU, sauf mention contraire. Toute reproduction ou exploitation, totale ou partielle, sans
          autorisation écrite préalable est interdite.
        </p>

        <h2>6. Vidéos tierces</h2>
        <p>
          Les vidéos intégrées proviennent de la chaîne YouTube InHabit_Archi et restent soumises aux conditions
          d’utilisation de YouTube (Google LLC).
        </p>

        <h2>7. Limitation de responsabilité</h2>
        <p>
          L’éditeur s’efforce d’assurer l’exactitude des informations diffusées, mais ne saurait être tenu responsable
          des erreurs, omissions ou de l’indisponibilité temporaire du service.
        </p>
      </div>
    </section>
  )
}
