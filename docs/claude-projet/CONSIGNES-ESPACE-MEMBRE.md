# Consignes : espace membre, livre protégé et paiement par carte

À ajouter aux fichiers du projet Claude « Supabase », à côté de CONTEXTE.md et INSTRUCTIONS.md.
Rédigé le 23 novembre 2026. Les règles d'INSTRUCTIONS.md restent valables : réponses en français et simples, aucun secret dans le code ni dans les réponses, et confirmation avant toute action irréversible.

## 1. Ce qui a changé dans le site

Le code est sur GitHub (dossier `inhabit-app/`). Il ajoute :

| Élément | Rôle |
|---|---|
| **Espace membre** (`/espace-membre`) | Réservé aux **abonnés**. Un lecteur crée son compte (email ou Google), mais tant que son paiement n'est pas confirmé, il n'entre pas : il arrive sur la page « Abonnement » (`/espace-membre/abonnement`) pour payer. Après paiement : liseuse (double page, miniatures, marque-pages, reprise de lecture). |
| **Livre en PDF protégé** | L'admin téléverse le PDF dans « Mes contenus → Livre CONCEPT — PDF protégé ». Seuls les comptes abonnés (paiement confirmé, accès en cours) peuvent le lire. Il n'y a plus d'extrait gratuit. |
| **Paiement par carte** (Stripe Checkout) | Pour le livre (achat à vie, ou abonnement d'une durée en jours) et pour l'Accompagnement. **On ne peut rien acheter sans être connecté** : chaque paiement est rattaché à un compte, pour la traçabilité. |

### Nouvelles tables (schéma `payload`)

Elles sont créées **uniquement** par les migrations Payload `20261123_004525_espace_membre_paiements` puis `20261123_142007_membres_google` (ajoute seulement la colonne `google_id` à `members`). **Ne crée aucune table à la main.**

| Table | Contenu |
|---|---|
| `members`, `members_sessions`, `members_bookmarks` | Comptes lecteurs, distincts des administrateurs (`users`) : mot de passe chiffré par Payload, accès au livre, date de fin d'accès, marque-pages. |
| `orders` | Commandes payées par carte : référence, montant, statut, compte membre, identifiants Stripe. |
| `book_files` | Fiches des PDF du livre. Le fichier lui-même est dans le bucket privé `livres`. |
| `book_chapters` | Version texte facultative du livre, chapitre par chapitre. |

La migration ajoute aussi des colonnes à `book_editions`, `coaching` et `coaching_bookings` (prix payable en ligne, devise, statut de paiement…). **Elle ne supprime et ne modifie aucune donnée existante.**

## 2. Ce qu'il faut faire, dans l'ordre

### Étape 1 : créer le bucket privé du livre

Dans Supabase, projet **`inhabit`** (réf. `fakvtocxtvnhxefjdogx`). Ne touche jamais au projet `UCAO's-Marketplace`.

1. Menu de gauche : **Storage**, puis **New bucket**.
2. Nom : **`livres`**.
3. **Public bucket : désactivé.** C'est le point essentiel : le PDF ne doit jamais avoir d'adresse publique.
4. **Restrict file size :** activé, **200 MB**.
5. **Restrict MIME types :** `application/pdf`.
6. **Create bucket**.
7. N'ajoute **aucune policy** sur ce bucket. Le site y accède avec les clés S3 serveur, qui existent déjà. Personne d'autre ne doit pouvoir le lire.

> Ne mets jamais le PDF dans le bucket `media` : celui-là est public.

### Étape 2 : variables d'environnement sur Vercel

Vercel → projet → **Settings → Environment Variables**. Ajoute, pour **Production** et **Preview** :

| Variable | Valeur |
|---|---|
| `S3_PRIVATE_BUCKET` | `livres` |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (voir étape 4), qui commence par `sk_test_` pour les essais, puis par `sk_live_`. |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook Stripe, qui commence par `whsec_`. |
| `GOOGLE_CLIENT_ID` | Bouton « Continuer avec Google » : ID client OAuth (voir étape 4 bis). |
| `GOOGLE_CLIENT_SECRET` | Secret de ce client OAuth. |

À vérifier en même temps :
- `NEXT_PUBLIC_SERVER_URL` doit être **l'adresse finale du site**. Elle sert aux retours de paiement et aux liens dans les emails.
- Les variables `S3_*` existantes restent identiques : les mêmes clés S3 servent aux deux buckets.
- Le **SMTP** doit fonctionner. Sinon, les emails « mot de passe oublié » et les reçus de paiement ne partent pas.

Tant que `STRIPE_SECRET_KEY` est absente, le site fonctionne normalement, mais les boutons « Payer par carte » n'apparaissent pas. Tant que les variables `GOOGLE_*` sont absentes, le bouton Google n'apparaît pas (la connexion par email reste disponible).

### Étape 3 : appliquer la migration

C'est automatique : au prochain déploiement Vercel, Payload applique les migrations en attente (`prodMigrations`).

Pour vérifier, dans **SQL Editor** (lecture seule) :

```sql
select name, created_at from payload.payload_migrations order by created_at;
-- la dernière ligne doit être 20261123_142007_membres_google

select table_name from information_schema.tables
where table_schema = 'payload'
  and table_name in ('members','members_sessions','members_bookmarks','orders','book_files','book_chapters')
order by table_name;
-- 6 lignes attendues
```

Si la migration n'est pas passée, lis les logs du déploiement Vercel avant d'agir. Elle peut aussi se lancer depuis un poste avec la connexion **directe** (port 5432) : `npx payload migrate` dans `inhabit-app/`. **Ne fais jamais de reset de la base.**

### Étape 4 : Stripe (à faire avec Alfred)

1. Créer un compte sur stripe.com, au nom de Warren ou de son activité. Rester en **mode test** pour commencer.
2. **Developers → API keys** : copier la **Secret key** dans `STRIPE_SECRET_KEY` sur Vercel. Ne jamais la coller dans une réponse.
3. **Developers → Webhooks → Add endpoint** :
   - adresse : `https://<adresse-du-site>/paiement/webhook` ;
   - événements : `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`.
4. Copier le **Signing secret** dans `STRIPE_WEBHOOK_SECRET`, puis **redéployer** sur Vercel.
5. Pour passer en réel plus tard : activer le compte Stripe (identité, IBAN), puis remplacer les deux clés par les versions `live`.

### Étape 4 bis : connexion Google (à faire avec Alfred)

1. https://console.cloud.google.com → créer (ou choisir) un projet → **API et services → Écran de consentement OAuth** : type « Externe », nom « InHabit », email d'assistance, domaine du site, lien vers `/confidentialite`. Portées : `openid`, `email`, `profile` uniquement. Publier l'application (sinon seuls les comptes « testeurs » peuvent se connecter).
2. **Identifiants → Créer → ID client OAuth → Application Web**. URI de redirection autorisée, exactement : `https://<adresse du site>/espace-membre/google/retour` (la même base que `NEXT_PUBLIC_SERVER_URL`).
3. Copier l'ID et le secret dans `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sur Vercel, puis **redéployer**.
4. Se connecter avec Google ne donne **aucun** accès au livre : le compte arrive sur la page d'abonnement, comme un compte email. Si un compte email existait déjà avec la même adresse, il est relié au compte Google, son ancien mot de passe est désactivé et ses autres sessions sont fermées (protection contre un compte créé par quelqu'un d'autre avec cette adresse). Le membre peut rechoisir un mot de passe avec « Mot de passe oublié ».

### Étape 5 : sécurité, à vérifier

1. **Settings → API → Exposed schemas** : seuls `public` et `graphql_public` doivent y figurer. **`payload` ne doit pas y être.** Sinon, la clé publique pourrait lire les comptes et les commandes.
2. **Storage → `livres`** : le bucket doit être marqué *Private*, sans policy.
3. Option de défense supplémentaire : activer RLS sur les tables sensibles. **N'avance que si le site s'y connecte avec le rôle propriétaire des tables.** Sinon, le site ne pourrait plus lire ses propres données. Vérifie d'abord :
   ```sql
   select tablename, tableowner from pg_tables where schemaname = 'payload' and tablename in ('members','orders','book_files');
   ```
   Si le propriétaire est `postgres` et que `DATABASE_URL` utilise ce même rôle (`postgres.<réf>` sur le pooler), propose à Alfred, **puis attends son accord** :
   ```sql
   alter table payload.members enable row level security;
   alter table payload.members_sessions enable row level security;
   alter table payload.members_bookmarks enable row level security;
   alter table payload.orders enable row level security;
   alter table payload.book_files enable row level security;
   ```
   Sans policy, ces tables deviennent illisibles pour les rôles `anon` et `authenticated`. Le propriétaire y accède toujours. Après le changement, vérifie que l'espace membre et l'admin fonctionnent encore.
4. **Advisors → Security** : signale à Alfred tout nouvel avertissement.

### Étape 6 : test complet (avec Alfred)

1. Admin → **Mes contenus → Livre CONCEPT — PDF protégé → Ajouter** : téléverser un PDF de test, type « Livre complet », **En ligne** coché.
   - Si l'envoi échoue avec une erreur CORS dans la console du navigateur, le bucket refuse l'envoi direct depuis le site. Note l'erreur exacte et préviens Alfred avant de modifier quoi que ce soit.
2. Admin → **Mon site → Livre CONCEPT → Éditions** : dans une édition, ouvrir « Paiement par carte sur le site ». Cocher « Proposer le paiement par carte », indiquer un prix et cocher « Ouvre la lecture en ligne ». Pour un abonnement, ajouter une durée en jours.
3. Sur le site, déconnecté : `/produits/livre-concept` → « Payer par carte ». Le site doit demander de se connecter.
4. Créer un compte (email, puis aussi Google) : **avant paiement**, `/espace-membre`, `/espace-membre/livre`, `/espace-membre/profil` doivent tous renvoyer vers `/espace-membre/abonnement`.
5. Payer depuis la page d'abonnement avec la carte de test **4242 4242 4242 4242** (date future, n'importe quel code).
6. Vérifier :
   - dans **Ventes & membres → Commandes** : la commande est « Payée » ;
   - dans **Membres** : « Accès au livre » est coché ;
   - le livre s'ouvre dans `/espace-membre` → « Lire CONCEPT », avec le nom du lecteur en filigrane ;
   - dans Storage, le fichier est bien dans `livres` et **pas** dans `media`.

## 3. Ce que la protection du livre fait, et ne fait pas

À expliquer simplement si Warren pose la question :

- **Ce qui est fait :**
  - le PDF n'a aucune adresse publique, et seuls les comptes connectés qui ont payé y accèdent ;
  - le livre arrive en petits morceaux brouillés, jamais en un fichier entier ;
  - le bouton « télécharger » n'existe pas, et l'impression, le clic droit et Ctrl+S sont bloqués ;
  - le nom et l'email du lecteur sont **incrustés dans chaque page**, et un second filigrane (nom, email, date et heure) **se déplace** sur les pages toutes les 6 secondes : impossible de le recadrer hors d'une vidéo ;
  - **bouclier anti-capture** : le livre disparaît (écran « Lecture masquée ») dès que la fenêtre perd le focus (outil Capture d'écran, OBS, autre application), dès que la touche Windows ou Cmd est enfoncée (raccourcis Win+Maj+S, Win+Alt+R, Cmd+Maj+3/4/5) et sur la touche Impr. écran, dont le presse-papiers est écrasé.
- **Ce qui est impossible sur un site web :** garantir à 100 % qu'aucune capture ni aucun enregistrement n'est fait. Le système (Windows, macOS, Android, iOS) capture l'écran sans demander l'avis du navigateur ; un logiciel d'enregistrement déjà lancé avant l'ouverture du livre, ou une photo prise avec un téléphone, ne peuvent être ni détectés ni bloqués. Sur téléphone, les captures ne déclenchent aucun signal. Le filigrane reste la vraie parade : une copie qui circule désigne la personne qui l'a faite.
- La seule technique qui noircit vraiment les captures est la protection DRM des vidéos (Widevine, PlayReady, FairPlay) : elle demande de transformer le livre en vidéo protégée, un service payant de licences, et elle ne fonctionne que sur certains navigateurs et appareils. Non mise en place.
- Un informaticien déterminé peut toujours reconstituer un document qui s'affiche à l'écran. Les mesures ci-dessus rendent la copie difficile et traçable, pas impossible.

## 4. À ne pas faire

- Rendre le bucket `livres` public, ou y ajouter une policy pour `anon` / `authenticated`.
- Créer ou modifier des tables à la main dans le schéma `payload`.
- Exposer le schéma `payload` dans l'API.
- Coller une clé Stripe, une clé S3 ou un mot de passe dans une réponse, dans GitHub ou dans un fichier versionné.
