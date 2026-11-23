# InHabit_Archi : contexte du projet

État au 23 novembre 2026. À tenir à jour quand quelque chose change.

## 1. Le projet en bref

- **Client :** Warren Riad AYITOU, architecte et auteur. Il est basé entre le Japon et l'Afrique de l'Ouest.
- **Marque :** InHabit_Archi, avec une chaîne YouTube, le livre CONCEPT, un service d'accompagnement et des projets d'architecture.
- **Objectif du site :** un site vitrine et interactif. Il présente la chaîne, valorise les projets, vend le livre et les services, et reçoit les demandes (contact, rendez-vous, réservations, suggestions de sujets).
- **Avis du client :** il est très content du site public. L'espace admin vient d'être refait (voir section 6) pour qu'il en soit aussi satisfait.

### Cahier des charges (résumé)

Le menu principal comporte 5 rubriques :

| Rubrique | Contenu |
|---|---|
| **Accueil** | Présentation, dernière vidéo YouTube, actualités (concours, événements, conférences), livre CONCEPT, quelques projets, accès rapide au rendez-vous, contact pour les partenariats. |
| **YouTube** | Vision et ligne éditoriale, dernières vidéos (intégration automatique), classement par thématiques, sujets de la communauté, formulaire de suggestion de sujets, lien d'abonnement. |
| **Produits & Services** | Voir le détail ci-dessous. |
| **Projets** | 3 catégories :<br>1. Projets architecturaux : contexte, programme, démarche, images et plans, avec une **carte interactive de l'Afrique** (clic sur un pays → ses projets).<br>2. Recherche et publications.<br>3. Concours et événements organisés par InHabit. |
| **À propos** | Présentation, historique, vision, fondateur, collaborateurs, références et partenaires, coordonnées et réseaux sociaux. Formulaire de contact avec un **motif** : partenariat entreprise, institution, organisateur d'événement, question. |

**Produits & Services** se décompose en trois offres :
1. **Livre CONCEPT** : présentation, contenu, éditions, prix, formats, liens de commande, extraits. **Le lien de commande officiel est https://alfred-bit-co.github.io/Concept/**. Le contenu actuel pointe encore vers un lien Amazon d'exemple, à remplacer dans l'admin.
2. **Accompagnement CONCEPT** (payant) :
   - 4 semaines individuelles ;
   - le participant choisit son mois ;
   - 3 ou 4 places par mois, mais **le site affiche toujours 1 ou 2 places restantes** (le nombre affiché est réglable) ;
   - tarif et formulaire de réservation.
3. **Rendez-vous architectural** (gratuit) : choix d'une date et d'un créneau disponible, description du projet, confirmation.

**Fonctions transversales :**
- bouton de rendez-vous ;
- formulaire de contact ;
- réseaux sociaux ;
- gestion des actualités ;
- admin pour tout modifier sans développeur, y compris consulter les demandes et les suggestions ;
- site adapté au mobile.

**Orientation visuelle :** une plateforme architecturale contemporaine, sobre, visuelle et intuitive. Les images y occupent une grande place et la navigation reste légère.

## 2. Code et outils

- **Dépôt GitHub :** https://github.com/Alfred-bit-co/InHabit (branche `main`). L'application est dans **`inhabit-app/`**. Les images d'origine sont à la racine du dépôt et servent au script `seed`.
- **Technologies :**
  - Next.js 16.4 (App Router) ;
  - React 19 ;
  - Payload CMS 3.93, pour l'admin et l'API ;
  - TypeScript.
- **Base de données :** Payload choisit automatiquement selon `DATABASE_URL` (voir `src/payload.config.ts`) :
  - une adresse qui commence par `postgres` → adaptateur PostgreSQL (`@payloadcms/db-postgres`, déjà installé) ;
  - sinon → SQLite, avec le fichier local `inhabit.db` (ignoré par Git). C'est le cas aujourd'hui en local.
- **Images :**
  - collection `media`, stockée aujourd'hui sur le disque, dans le dossier `inhabit-app/media/` (ignoré par Git) ;
  - tailles générées : `thumb` 480 px, `card` 960 px, `large` 1920 px ;
  - **aucun adaptateur de stockage cloud n'est installé pour l'instant.**
- **Emails :**
  - envoyés via SMTP (nodemailer) si `SMTP_HOST` est défini, sinon affichés dans la console ;
  - une notification part à chaque nouvelle demande (`src/hooks/notify.ts`) ;
  - l'adresse destinataire vient des Réglages du site, sinon de `ADMIN_EMAIL`.
- **Commandes utiles** (à lancer dans `inhabit-app/`) :

| Commande | Rôle |
|---|---|
| `npm run dev` | Site en local sur http://localhost:3000, admin sur `/admin`. |
| `npm run seed` | Crée l'administrateur et le contenu de démonstration à partir des images à la racine du dépôt. Ne fait rien si des projets existent déjà ; `SEED_FORCE=1` force l'ajout. |
| `npm run generate:types` | Régénère `src/payload-types.ts` après une modification du schéma. |
| `npm run generate:importmap` | À relancer après l'ajout d'un composant admin personnalisé. |
| `npm run export:static -- --deploy` | Régénère la version statique et la publie sur GitHub Pages (voir section 5). |

### Variables d'environnement

Elles sont listées dans `inhabit-app/.env.example`. Les vraies valeurs ne doivent **jamais** être dans Git.

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | `postgres://…` (Supabase) en production, `file:./inhabit.db` en local. |
| `PAYLOAD_SECRET` | Longue chaîne aléatoire, différente en production. |
| `NEXT_PUBLIC_SERVER_URL` | Adresse publique du site (par exemple l'adresse Vercel). Sert aux URL des images et aux métadonnées. |
| `ADMIN_EMAIL` | Destinataire des notifications si les Réglages du site sont vides. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Envoi des emails. |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Compte administrateur créé par `npm run seed`. |
| `S3_PRIVATE_BUCKET` | Bucket Supabase **privé** du livre en PDF (`livres`). |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Paiement par carte. Vides : les boutons de paiement sont masqués. |

## 3. Structure du contenu (Payload)

### Collections

| Slug | Contenu |
|---|---|
| `news` | Actualités. Champs `type`, `date`, image, `published`. |
| `projects` | Projets architecturaux : pays, année, statut, images, `featured` (mis en avant sur l'accueil), `published`, `order`. |
| `publications` | Recherches et publications. |
| `events` | Concours et événements. |
| `media` | Images et PDF, avec un texte alternatif obligatoire. |
| `video-themes`, `videos` | Vidéos YouTube et leurs thématiques (`featured` = vidéo à la une sur l'accueil). |
| `coaching-bookings` | Réservations de l'accompagnement (formulaire du site). |
| `appointments` | Rendez-vous architecturaux (formulaire du site). |
| `contact-messages` | Messages de contact, avec leur motif. |
| `topic-suggestions` | Suggestions de sujets YouTube. |
| `users` | Administrateurs (seuls à entrer dans /admin). |
| `members` | Lecteurs inscrits sur le site (espace membre). Comptes séparés des administrateurs. |
| `orders` | Commandes payées par carte, toujours rattachées à un compte membre. |
| `book-files` | Le livre en PDF (complet ou extrait), stocké en privé. |
| `book-chapters` | Version texte facultative du livre, par chapitres. |

**Règles d'accès** (`src/access/index.ts`) :
- le public lit uniquement les contenus `published = true` ;
- les quatre collections de demandes sont réservées à l'admin, mais le site peut les créer via ses server actions (`src/app/(frontend)/actions.ts`).

### Globals

| Slug | Contenu |
|---|---|
| `site-settings` | Réglages du site : email de notification, réseaux sociaux, YouTube… |
| `home` | Page d'accueil. |
| `youtube-page` | Page YouTube. |
| `book` | Livre CONCEPT : éditions, prix, liens de commande, extraits. |
| `coaching` | Accompagnement : tarif, mois ouverts, capacité, places affichées. |
| `appointment-settings` | Disponibilités des rendez-vous. |
| `about` | Page À propos. Le fondateur (`founder.name`, `founder.role`, `founder.photo`) sert aussi à la photo et au « Bienvenue Warren » de l'admin. |

## 4. Identité visuelle (à respecter partout)

Les variables sont définies dans `src/app/(frontend)/styles.css` :

| Rôle | Couleur |
|---|---|
| Fond blanc cassé | `#f3eee6` |
| Papier | `#faf7f2` |
| Beige | `#e7dccb` |
| Beige soutenu | `#dccdb6` |
| Encre, boutons foncés | `#1f1a15` |
| Texte secondaire | `#7a6e60` |
| **Accent terre cuite** | **`#a45428`** (variante `#c0693a`) |

Autres règles :
- **Police :** Century Gothic, avec Urbanist (Google Fonts) en remplacement.
- **Formes :** coins très arrondis (cartes de 24 à 28 px, boutons en pilule).
- **Style :** sobre, beaucoup d'images, peu d'éléments.
- **Logo :** un carré terre cuite « In », suivi de « Habit ».
- **Modes :** le site a un mode clair et un mode sombre ; **l'admin est toujours en clair**, par choix du client.

## 5. Mise en ligne : où on en est

**Version de démonstration (GitHub Pages)**
- Adresse : https://alfred-bit-co.github.io/InHabit/
- Il s'agit d'une **copie statique** du site, publiée sur la branche `gh-pages` par le script `inhabit-app/scripts/export-static.mjs`.
- Ce qui ne marche pas sur cette version : l'admin, l'envoi des formulaires et les filtres par type.

**Version définitive (Vercel), à faire**
- Le dépôt sera importé dans Vercel avec **Root Directory = `inhabit-app`**. Le client a déjà un compte Vercel relié à GitHub.
- Réglage recommandé : région des fonctions **Paris (`cdg1`)**, pour être proche de la base Supabase.

**Supabase**
- Un projet a été créé le 13/11/2026 :
  - nom : **`inhabit`** ;
  - référence : **`fakvtocxtvnhxefjdogx`** ;
  - région : **eu-west-3 (Paris)** ;
  - offre gratuite, organisation « Alfred AYITOU ».
- Le projet est vide : aucune table, aucun contenu.
- **Le mot de passe de la base n'est connu de personne.** Il faut le réinitialiser dans Supabase (Project Settings → Database → Reset database password) pour construire `DATABASE_URL`.
- Sur Vercel (serverless), utiliser la chaîne de connexion **« Transaction pooler »** (port 6543) de Supabase. La connexion directe (port 5432) convient pour les migrations faites depuis un poste.
- Le même compte Supabase contient un autre projet, `UCAO's-Marketplace`, **qui n'a rien à voir avec ce site : ne pas y toucher.**

### Reste à faire (rôle du projet Claude « Supabase »)

1. **Base Postgres :**
   - réinitialiser le mot de passe ;
   - renseigner `DATABASE_URL` ;
   - laisser Payload créer le schéma (`payload migrate:create`, puis `payload migrate`, ou le mode `push` en développement) ;
   - vérifier les règles d'accès.
2. **Stockage des images :** Vercel ne garde pas les fichiers envoyés, il faut donc un stockage cloud. Deux options :
   - **Supabase Storage**, via l'API compatible S3, avec `@payloadcms/storage-s3`. Les clés S3 se créent dans Project Settings → Storage ;
   - **Vercel Blob**, avec `@payloadcms/storage-vercel-blob`.

   Dans les deux cas, activer l'adaptateur seulement si les variables sont présentes, pour garder le disque en local.
3. **Contenu :** remplir la base de production. Deux possibilités :
   - lancer `npm run seed` contre Postgres, après avoir configuré le stockage, pour recréer le contenu et les images de démonstration ;
   - migrer le contenu actuel de `inhabit.db`.

   À savoir : certaines demandes de test en local ont des accents abîmés (« aujourd�hui », « A�cha »). Ce sont des données de test, à ne pas recopier.
4. **Vercel :** coller les variables d'environnement, déployer, puis mettre à jour `NEXT_PUBLIC_SERVER_URL` avec l'adresse finale.
5. **Emails :** configurer le SMTP pour que les notifications de demandes arrivent vraiment.
6. **Après la mise en ligne :** remplacer, dans l'admin (Livre CONCEPT → éditions), le lien Amazon d'exemple par https://alfred-bit-co.github.io/Concept/.

## 6. Espace admin (refait le 13/11/2026)

- **Tableau de bord personnalisé** (`src/components/admin/Dashboard.tsx` pour les données, `DashboardClient.tsx` pour l'affichage), avec :
  - « Bienvenue Warren » et la date ;
  - la photo et la carte profil de Warren ;
  - le projet à la une en grande image ;
  - les chiffres clés : demandes à traiter, rendez-vous à venir, messages ;
  - trois cartes : rendez-vous par mois, places de l'accompagnement, contenus du site ;
  - une boîte de réception de toutes les demandes, avec filtres, détail et action rapide (confirmer, marquer traité…).
- **Style global de l'admin :** `src/app/(payload)/custom.scss`. La gamme de gris de Payload (`--color-base-*`) et son accent (`--color-success-*`) sont remplacés par la palette du site.
- **Logo, icône et avatar** (photo de Warren) : `src/components/admin/Graphics.tsx`.
- **Pastilles « Oui / Non »** dans les listes : `BoolCell.tsx`.
- **Libellés français retouchés** dans `payload.config.ts` (`i18n.translations`).

## 7. Espace membre et paiement (ajoutés le 23/11/2026)

- **Espace membre** `/espace-membre`, inspiré d'une liseuse : menu à gauche (Ma bibliothèque, Lire CONCEPT, Marque-pages, Mes achats, Profil, Déconnexion), lecture en double page avec une bande de miniatures en bas.
- **Livre protégé :** l'admin téléverse le PDF (Mes contenus → Livre CONCEPT — PDF protégé). Les comptes qui ont payé lisent le livre complet, les autres l'extrait. Le livre n'est jamais téléchargeable : il arrive par morceaux brouillés, avec le nom du lecteur en filigrane, et l'impression comme Ctrl+S sont bloqués. Un enregistrement vidéo de l'écran ne peut pas être bloqué sur le web : le filigrane permet de retrouver qui l'a fait.
- **Paiement par carte :** Stripe Checkout, réglé par édition dans l'admin (prix, devise, accès à vie ou durée en jours pour un abonnement) et pour l'Accompagnement (lien de paiement dans l'email de confirmation). **Il faut être connecté pour acheter.** La confirmation arrive par le webhook `/paiement/webhook`.
- **Sécurité :** les règles d'accès vérifient que le compte est un administrateur (`users`), pas seulement qu'il est connecté. Un membre n'a aucun droit d'administration.
- La mise en place côté Supabase et Stripe est décrite dans **CONSIGNES-ESPACE-MEMBRE.md**.

## 8. Décisions et préférences du client

- La **page d'accueil** ne doit pas être modifiée sans demande explicite.
- Deux éléments ont été retirés à sa demande : la bande défilante de mots sur l'accueil, et la barre « Ouvert aux nouveaux projets / Architecture · Livre · YouTube / Japon · Afrique de l'Ouest ».
- Les espaces vides ont été réduits sur tout le site.
- L'admin doit être **épuré**, aux couleurs du site, avec sa photo. Ses références : des tableaux de bord immobiliers clairs, avec une grande image d'architecture, une navigation en pastilles, des cartes sobres et un seul accent de couleur.
- La personne qui pilote le projet (Alfred) parle français et préfère des explications simples avec des étapes concrètes.
