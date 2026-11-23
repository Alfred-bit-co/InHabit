# Consignes : espace membre, livre protégé et paiement par carte

À ajouter aux fichiers du projet Claude « Supabase », à côté de CONTEXTE.md et INSTRUCTIONS.md.
Rédigé le 23 novembre 2026. Les règles d'INSTRUCTIONS.md restent valables : réponses en français et simples, aucun secret dans le code ni dans les réponses, et confirmation avant toute action irréversible.

## 1. Ce qui a changé dans le site

Le code est sur GitHub (dossier `inhabit-app/`). Il ajoute :

| Élément | Rôle |
|---|---|
| **Espace membre** (`/espace-membre`) | Les lecteurs créent un compte, puis lisent le livre en ligne dans une liseuse (double page, miniatures, marque-pages, reprise de lecture). |
| **Livre en PDF protégé** | L'admin téléverse le PDF dans « Mes contenus → Livre CONCEPT — PDF protégé ». Seuls les comptes qui ont payé lisent le livre complet. Les autres comptes lisent l'extrait, s'il y en a un. |
| **Paiement par carte** (Stripe Checkout) | Pour le livre (achat à vie, ou abonnement d'une durée en jours) et pour l'Accompagnement. **On ne peut rien acheter sans être connecté** : chaque paiement est rattaché à un compte, pour la traçabilité. |

### Nouvelles tables (schéma `payload`)

Elles sont créées **uniquement** par la migration Payload `20261123_004525_espace_membre_paiements`. **Ne crée aucune table à la main.**

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

À vérifier en même temps :
- `NEXT_PUBLIC_SERVER_URL` doit être **l'adresse finale du site**. Elle sert aux retours de paiement et aux liens dans les emails.
- Les variables `S3_*` existantes restent identiques : les mêmes clés S3 servent aux deux buckets.
- Le **SMTP** doit fonctionner. Sinon, les emails « mot de passe oublié » et les reçus de paiement ne partent pas.

Tant que `STRIPE_SECRET_KEY` est absente, le site fonctionne normalement, mais les boutons « Payer par carte » n'apparaissent pas.

### Étape 3 : appliquer la migration

C'est automatique : au prochain déploiement Vercel, Payload applique les migrations en attente (`prodMigrations`).

Pour vérifier, dans **SQL Editor** (lecture seule) :

```sql
select name, created_at from payload.payload_migrations order by created_at;
-- la dernière ligne doit être 20261123_004525_espace_membre_paiements

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
4. Créer un compte, payer avec la carte de test **4242 4242 4242 4242** (date future, n'importe quel code).
5. Vérifier :
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
  - le nom et l'email du lecteur sont **incrustés dans chaque page**.
- **Ce qui est impossible sur un site web :** empêcher un enregistrement vidéo de l'écran ou une photo prise avec un téléphone. Aucun navigateur ne laisse un site détecter ou bloquer ça. Le filigrane est la vraie parade : une copie qui circule désigne la personne qui l'a faite. Les captures d'écran restent possibles, comme Warren l'a accepté.
- Un informaticien déterminé peut toujours reconstituer un document qui s'affiche à l'écran. Les mesures ci-dessus rendent la copie difficile et traçable, pas impossible.

## 4. À ne pas faire

- Rendre le bucket `livres` public, ou y ajouter une policy pour `anon` / `authenticated`.
- Créer ou modifier des tables à la main dans le schéma `payload`.
- Exposer le schéma `payload` dans l'API.
- Coller une clé Stripe, une clé S3 ou un mot de passe dans une réponse, dans GitHub ou dans un fichier versionné.
