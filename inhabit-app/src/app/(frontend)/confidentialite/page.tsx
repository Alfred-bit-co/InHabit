import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Politique de confidentialité', robots: { index: false } }

export default async function PrivacyPage() {
  const email = 'ayitouw@gmail.com'
  return (
    <section className="section-tight">
      <div className="container prose">
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}>Politique de confidentialité</h1>
        <p className="muted">Dernière mise à jour : 14 novembre 2026</p>

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
            <strong>Hébergement du site</strong> : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723,
            États-Unis.
          </li>
          <li>
            <strong>Hébergement des données</strong> (base de données et images) : Supabase, serveurs situés à Paris
            (France).
          </li>
          <li>
            <strong>Envoi d’emails</strong> : uniquement pour les notifications et confirmations liées à vos
            demandes.
          </li>
        </ul>

        <h2>4. Cookies</h2>
        <p>Le site public ne dépose aucun cookie publicitaire ni de mesure d’audience.</p>

        <h2>5. Durée de conservation</h2>
        <p>
          Les demandes sont conservées 3 ans après le dernier échange, puis supprimées.
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
