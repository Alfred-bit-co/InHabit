import type { Metadata } from 'next'
import { getSettings } from '@/lib/payload'

export const metadata: Metadata = { title: 'Politique de confidentialité', robots: { index: false } }

export default async function PrivacyPage() {
  const settings = await getSettings()
  const email = settings.contactEmail || '[adresse e-mail à compléter]'
  return (
    <section className="section-tight">
      <div className="container prose">
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}>Politique de confidentialité</h1>
        <p className="muted">Dernière mise à jour : [date à compléter]</p>

        <h2>1. Responsable du traitement</h2>
        <p>
          Ce site est édité par Warren Riad AYITOU. Pour toute question relative à vos données personnelles :{' '}
          {email}.
        </p>

        <h2>2. Données collectées</h2>
        <p>Nous collectons uniquement les données que vous nous transmettez volontairement via les formulaires :</p>
        <ul>
          <li>
            <strong>Contact et partenariats</strong> : nom, email, organisation, message — pour répondre à votre
            demande.
          </li>
          <li>
            <strong>Suggestion de sujet</strong> : sujet proposé, et facultativement nom et email — pour enrichir la
            ligne éditoriale de la chaîne.
          </li>
          <li>
            <strong>Accompagnement CONCEPT</strong> : nom, email, téléphone, pays, profil, motivation — pour gérer
            votre inscription.
          </li>
          <li>
            <strong>Rendez-vous architectural</strong> : nom, email, téléphone, présentation du projet, date choisie —
            pour organiser l’échange.
          </li>
        </ul>
        <p>Ces données sont enregistrées dans la base de données du site, accessible uniquement à l’administrateur.</p>

        <h2>3. Services tiers</h2>
        <ul>
          <li>
            <strong>YouTube (Google LLC)</strong> : les vidéos ne se chargent qu’après un clic sur la miniature, via
            le mode « confidentialité renforcée » (youtube-nocookie.com).
          </li>
          <li>
            <strong>Hébergement</strong> : [nom de l’hébergeur et de la base de données à compléter].
          </li>
          <li>
            <strong>Envoi d’emails</strong> : [service d’envoi à compléter], uniquement pour les notifications et
            confirmations.
          </li>
        </ul>

        <h2>4. Cookies</h2>
        <p>Le site public ne dépose aucun cookie publicitaire ni de mesure d’audience.</p>

        <h2>5. Durée de conservation</h2>
        <p>
          Les demandes sont conservées le temps nécessaire à leur traitement, puis au maximum [durée à préciser, ex.
          3 ans] avant suppression.
        </p>

        <h2>6. Vos droits</h2>
        <p>
          Vous disposez d’un droit d’accès, de rectification et de suppression de vos données. Pour l’exercer,
          écrivez à {email}.
        </p>
      </div>
    </section>
  )
}
