# InHabit_Archi — site + espace d’administration

Site vitrine d’InHabit_Archi construit avec **Next.js 16** et **Payload CMS 3**.
Le site public et l’administration (`/admin`) vivent dans le même projet.

## Démarrer en local

```bash
npm install
npm run seed      # crée le compte admin de test + le contenu de démonstration
npm run dev       # http://localhost:3000  —  admin : http://localhost:3000/admin
```

Le compte admin de test est défini dans `.env` (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).
En local la base est un fichier SQLite (`inhabit.db`) et les images vont dans `media/`.
Pour repartir de zéro : supprimer `inhabit.db` et `media/`, puis relancer `npm run seed`.

## Ce que le client gère dans l’admin

| Menu | Contenu |
|---|---|
| Contenu | Actualités, Projets architecturaux (pays → carte de l’Afrique), Recherches & publications, Concours & événements, Médiathèque |
| YouTube | Vidéos (lien YouTube collé) et thématiques |
| Pages | Accueil (bandeau, carrousel, chiffres), page YouTube, À propos |
| Produits & services | Livre CONCEPT (éditions, prix, liens), Accompagnement (tarif, mois, places), Rendez-vous (jours, créneaux, congés) |
| Demandes reçues | Réservations, rendez-vous, messages de contact, suggestions de sujets |
| Paramètres | Réglages du site (email, réseaux, ID de la chaîne YouTube), administrateurs |

Automatismes :
- **Dernières vidéos** : renseigner l’ID de chaîne (`UC…`) dans *Réglages du site* → le site lit le flux YouTube (mis à jour toutes les heures).
- **Places de l’accompagnement** : capacité réelle − réservations non annulées. « Places affichées » permet d’afficher moins, jamais plus que la réalité.
- **Rendez-vous** : un créneau réservé disparaît du site ; passer un rendez-vous en « Annulé » le libère et prévient le visiteur.
- **Emails** : notification à l’admin + accusé de réception au visiteur ; confirmation envoyée quand une réservation passe en « Confirmée ».

## Mise en ligne (ex. Vercel + Neon/Supabase)

1. Créer une base **PostgreSQL** (Neon ou Supabase, offre gratuite) → `DATABASE_URL=postgres://…`
2. Générer les migrations : `npm run payload migrate:create` (avec `DATABASE_URL` Postgres), puis les commiter.
3. Stockage des images : Vercel n’a pas de disque persistant → ajouter un adaptateur de stockage
   (`@payloadcms/storage-vercel-blob` ou `@payloadcms/storage-s3`) dans `src/payload.config.ts`.
4. Variables d’environnement : `DATABASE_URL`, `PAYLOAD_SECRET` (longue chaîne aléatoire),
   `NEXT_PUBLIC_SERVER_URL` (URL du site), `SMTP_*` (ex. Resend, Brevo) et `ADMIN_EMAIL`.
5. Créer le premier administrateur sur `/admin` (ne pas utiliser le compte de test en production).

## Structure

```
src/
  collections/   modèles de contenu (admin)
  globals/       pages et réglages uniques
  app/(frontend) pages du site public + actions des formulaires
  app/(payload)  administration Payload (généré)
  components/    en-tête, carrousel, carte de l’Afrique, formulaires…
  lib/           disponibilités, YouTube, dates, utilitaires
  seed.ts        contenu de démonstration
```
