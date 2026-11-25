import type { GlobalConfig } from 'payload'
import { anyone, isLoggedIn } from '../access'
import { CURRENCIES } from '../lib/payments/money'

const access = { read: anyone, update: isLoggedIn }

/* ───────────── Réglages généraux ───────────── */

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Réglages du site',
  admin: {
    group: 'Réglages',
    hideAPIURL: true,
    components: {
      elements: {
        Description: { path: '/components/admin/Description#Description', clientProps: { text: 'Nom du site, email de contact, adresse qui reçoit les notifications, chaîne YouTube et réseaux sociaux.' } },
      },
    },
  },
  access,
  fields: [
    { name: 'siteName', type: 'text', label: 'Nom du site', defaultValue: 'InHabit_Archi' },
    {
      name: 'tagline',
      type: 'textarea',
      label: 'Phrase de présentation (pied de page, référencement)',
      defaultValue: 'Plateforme architecturale contemporaine : chaîne YouTube, livre CONCEPT, projets et recherches.',
    },
    {
      type: 'row',
      fields: [
        { name: 'contactEmail', type: 'email', label: 'Email public de contact' },
        { name: 'phone', type: 'text', label: 'Téléphone / WhatsApp' },
        { name: 'location', type: 'text', label: 'Localisation affichée' },
      ],
    },
    {
      name: 'notificationEmail',
      type: 'email',
      label: 'Email qui reçoit les notifications',
      admin: { description: 'Nouvelles réservations, rendez-vous, messages et suggestions.' },
    },
    {
      type: 'collapsible',
      label: 'Chaîne YouTube',
      fields: [
        {
          name: 'youtubeChannelId',
          type: 'text',
          label: 'Identifiant de la chaîne (commence par UC…)',
          admin: {
            description:
              'Permet d’afficher automatiquement les dernières vidéos. Sur YouTube : Paramètres → Paramètres avancés → ID de la chaîne.',
          },
        },
        { name: 'youtubeChannelUrl', type: 'text', label: 'Adresse de la chaîne' },
      ],
    },
    {
      name: 'socials',
      type: 'array',
      label: 'Réseaux sociaux',
      labels: { singular: 'Réseau', plural: 'Réseaux' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'platform',
              type: 'select',
              label: 'Réseau',
              required: true,
              options: [
                { label: 'YouTube', value: 'youtube' },
                { label: 'Instagram', value: 'instagram' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'Facebook', value: 'facebook' },
                { label: 'TikTok', value: 'tiktok' },
                { label: 'X / Twitter', value: 'x' },
                { label: 'WhatsApp', value: 'whatsapp' },
              ],
            },
            { name: 'url', type: 'text', label: 'Lien', required: true },
          ],
        },
      ],
    },
  ],
}

/* ───────────── Accueil ───────────── */

export const HomePage: GlobalConfig = {
  slug: 'home',
  label: 'Page d’accueil',
  admin: {
    group: 'Mon site',
    hideAPIURL: true,
    components: {
      elements: {
        Description: { path: '/components/admin/Description#Description', clientProps: { text: 'Les textes et images de la page d’accueil : bandeau, carrousel, présentation et appels à l’action.' } },
      },
    },
  },
  access,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Bandeau',
          fields: [
            { name: 'heroTitle', type: 'text', label: 'Grand titre', defaultValue: 'Architecture' },
            {
              type: 'row',
              fields: [
                { name: 'heroSubtitle', type: 'text', label: 'Sous-titre', defaultValue: 'begins as' },
                { name: 'heroAccent', type: 'text', label: 'Mot en couleur', defaultValue: 'art' },
              ],
            },
            { name: 'heroCta', type: 'text', label: 'Texte du bouton', defaultValue: 'Cliquez pour commencer' },
            {
              name: 'heroCards',
              type: 'array',
              label: 'Cartes du carrousel (à droite)',
              labels: { singular: 'Carte', plural: 'Cartes' },
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'title', type: 'text', label: 'Titre', required: true },
                { name: 'line1', type: 'text', label: 'Ligne 1' },
                { name: 'line2', type: 'text', label: 'Ligne 2' },
                { name: 'link', type: 'text', label: 'Lien (optionnel)' },
              ],
            },
            {
              name: 'strip',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              label: 'Bande d’images en bas du bandeau',
              admin: {
                description:
                  '3 à 5 images affichées côte à côte sous le bandeau. Laissée vide, la bande montre les images principales des projets.',
              },
            },
          ],
        },
        {
          label: 'Présentation',
          fields: [
            { name: 'introEyebrow', type: 'text', label: 'Surtitre', defaultValue: 'La chaîne InHabit_Archi' },
            // Pas affiché sur le site : masqué pour ne pas laisser croire qu'il a un effet
            { name: 'introTitle', type: 'text', label: 'Titre', admin: { hidden: true } },
            { name: 'introText', type: 'textarea', label: 'Texte' },
            {
              name: 'stats',
              type: 'array',
              label: 'Chiffres clés',
              maxRows: 4,
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'value', type: 'text', label: 'Valeur', required: true },
                    { name: 'label', type: 'text', label: 'Libellé', required: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Appels à l’action',
          fields: [
            { name: 'appointmentTitle', type: 'text', label: 'Titre — rendez-vous', defaultValue: 'Vous avez un projet de construction ?' },
            {
              name: 'appointmentText',
              type: 'textarea',
              label: 'Texte — rendez-vous',
              defaultValue: 'Réservez un premier échange gratuit pour parler de votre projet.',
            },
            { name: 'partnerTitle', type: 'text', label: 'Titre — partenariat', defaultValue: 'Construisons ensemble.' },
            {
              name: 'partnerText',
              type: 'textarea',
              label: 'Texte — partenariat',
              defaultValue: 'Entreprises, institutions, organisateurs d’événements : proposez-nous une collaboration.',
            },
          ],
        },
      ],
    },
  ],
}

/* ───────────── Page YouTube ───────────── */

export const YoutubePage: GlobalConfig = {
  slug: 'youtube-page',
  label: 'Page YouTube',
  admin: {
    group: 'Mon site',
    hideAPIURL: true,
    components: {
      elements: {
        Description: { path: '/components/admin/Description#Description', clientProps: { text: 'La présentation de la chaîne, la ligne éditoriale et les sujets qui intéressent la communauté.' } },
      },
    },
  },
  access,
  fields: [
    { name: 'title', type: 'text', label: 'Titre', defaultValue: 'Penser l’espace, en vidéo.' },
    { name: 'vision', type: 'textarea', label: 'Vision de la chaîne' },
    {
      name: 'editorialLine',
      type: 'array',
      label: 'Ligne éditoriale',
      labels: { singular: 'Axe', plural: 'Axes' },
      fields: [
        { name: 'title', type: 'text', label: 'Titre', required: true },
        { name: 'text', type: 'textarea', label: 'Texte' },
      ],
    },
    {
      name: 'communityTopics',
      type: 'array',
      label: 'Sujets qui intéressent la communauté',
      labels: { singular: 'Sujet', plural: 'Sujets' },
      fields: [{ name: 'topic', type: 'text', label: 'Sujet', required: true }],
    },
  ],
}

/* ───────────── Livre CONCEPT ───────────── */

export const Book: GlobalConfig = {
  slug: 'book',
  label: 'Livre CONCEPT',
  admin: {
    group: 'Mon site',
    hideAPIURL: true,
    components: {
      elements: {
        Description: { path: '/components/admin/Description#Description', clientProps: { text: 'La présentation du livre, ses éditions, ses prix, ses liens de commande et ses extraits.' } },
      },
    },
  },
  access,
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'title', type: 'text', label: 'Titre', defaultValue: 'CONCEPT' },
        { name: 'subtitle', type: 'text', label: 'Sous-titre' },
      ],
    },
    { name: 'cover', type: 'upload', relationTo: 'media', label: 'Couverture' },
    { name: 'pitch', type: 'textarea', label: 'Accroche (accueil et page produits)' },
    { name: 'presentation', type: 'richText', label: 'Présentation du livre' },
    { name: 'contents', type: 'richText', label: 'Contenu et démarche' },
    {
      name: 'editions',
      type: 'array',
      label: 'Éditions disponibles',
      labels: { singular: 'Édition', plural: 'Éditions' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', label: 'Édition (ex. Française)', required: true },
            { name: 'format', type: 'text', label: 'Format (ex. Broché, PDF)' },
            { name: 'price', type: 'text', label: 'Prix (ex. 29 €)' },
          ],
        },
        { name: 'cover', type: 'upload', relationTo: 'media', label: 'Couverture de l’édition' },
        {
          name: 'links',
          type: 'array',
          label: 'Liens de commande',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', label: 'Libellé (ex. Amazon)', required: true },
                { name: 'url', type: 'text', label: 'Lien', required: true },
              ],
            },
          ],
        },
        { name: 'available', type: 'checkbox', label: 'Disponible', defaultValue: true },
        {
          type: 'collapsible',
          label: 'Paiement par carte sur le site',
          admin: { initCollapsed: true },
          fields: [
            {
              name: 'payByCard',
              type: 'checkbox',
              label: 'Proposer le paiement par carte bancaire',
              defaultValue: false,
              admin: {
                description:
                  'Affiche un bouton « Payer par carte ». Fonctionne une fois les clés du prestataire de paiement ajoutées à la mise en ligne.',
              },
            },
            {
              type: 'row',
              fields: [
                { name: 'priceAmount', type: 'number', label: 'Prix encaissé (nombre seul, ex. 29)', min: 0 },
                { name: 'currency', type: 'select', label: 'Devise', defaultValue: 'eur', options: [...CURRENCIES] },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'digitalAccess',
                  type: 'checkbox',
                  label: 'Ouvre la lecture en ligne (espace membre)',
                  defaultValue: false,
                },
                {
                  name: 'accessDays',
                  type: 'number',
                  label: 'Durée de l’accès en jours (vide = à vie)',
                  min: 1,
                  admin: {
                    description: 'Pour un abonnement : ex. 30 ou 365. Un nouvel achat prolonge l’accès en cours.',
                    condition: (_, sibling) => Boolean(sibling?.digitalAccess),
                  },
                },
                {
                  name: 'requiresShipping',
                  type: 'checkbox',
                  label: 'Livre papier : demander l’adresse de livraison',
                  defaultValue: false,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'excerpts',
      type: 'array',
      label: 'Extraits (pages du livre)',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', label: 'Légende' },
      ],
    },
  ],
}

/* ───────────── Page Produits ───────────── */

/** Produits déjà proposés par le site : leurs textes par défaut viennent de leur propre page. */
export const PRODUCT_KINDS = [
  { label: 'Livre CONCEPT (page du livre)', value: 'livre' },
  { label: 'Accompagnement CONCEPT (page de réservation)', value: 'accompagnement' },
  { label: 'Rendez-vous gratuit (page des créneaux)', value: 'rendez-vous' },
  { label: 'Autre produit ou service (lien libre)', value: 'autre' },
] as const

const isLink = (v: unknown) =>
  !v || /^(\/(?!\/)|https?:\/\/|mailto:|tel:)/i.test(String(v).trim())
    ? true
    : 'Indiquez une page du site (commence par /) ou une adresse complète (https://…, mailto:, tel:).'

export const ProductsPage: GlobalConfig = {
  slug: 'products-page',
  label: 'Page Produits',
  admin: {
    group: 'Mon site',
    hideAPIURL: true,
    components: {
      elements: {
        Description: {
          path: '/components/admin/Description#Description',
          clientProps: {
            text: 'La page « Produits & services » : son titre et ses cartes. Ajoutez, retirez, masquez ou réordonnez les produits (glisser-déposer). Pour le livre, l’accompagnement et le rendez-vous, un champ laissé vide reprend le texte de leur propre page.',
          },
        },
      },
    },
  },
  access,
  fields: [
    {
      type: 'collapsible',
      label: 'Haut de la page',
      admin: { initCollapsed: true },
      fields: [
        { name: 'eyebrow', type: 'text', label: 'Petit titre', defaultValue: 'Produits & services' },
        {
          type: 'row',
          fields: [
            { name: 'title', type: 'text', label: 'Titre', defaultValue: 'Lire, apprendre,' },
            {
              name: 'titleAccent',
              type: 'text',
              label: 'Fin du titre (en couleur)',
              defaultValue: 'construire',
            },
          ],
        },
        {
          name: 'intro',
          type: 'textarea',
          label: 'Texte d’introduction',
          defaultValue: 'Des publications et des accompagnements pour développer une pensée architecturale juste.',
        },
      ],
    },
    {
      name: 'products',
      type: 'array',
      label: 'Produits affichés',
      labels: { singular: 'Produit', plural: 'Produits' },
      admin: {
        initCollapsed: true,
        description: 'Les cartes s’affichent dans cet ordre, numérotées automatiquement (01, 02…).',
        components: { RowLabel: '/components/admin/ProductRowLabel#ProductRowLabel' },
      },
      defaultValue: [
        { kind: 'livre', visible: true, label: 'Publication', buttonStyle: 'beige' },
        { kind: 'accompagnement', visible: true, label: 'Service payant', buttonStyle: 'accent' },
        { kind: 'rendez-vous', visible: true, label: 'Service gratuit', buttonStyle: 'beige' },
      ],
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'kind',
              type: 'select',
              label: 'Type de produit',
              required: true,
              defaultValue: 'autre',
              options: [...PRODUCT_KINDS],
            },
            {
              name: 'visible',
              type: 'checkbox',
              label: 'Affiché sur le site',
              defaultValue: true,
              admin: { style: { alignSelf: 'flex-end' } },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', label: 'Étiquette (ex. Publication, Service gratuit)' },
            { name: 'title', type: 'text', label: 'Nom du produit' },
          ],
        },
        { name: 'description', type: 'textarea', label: 'Description courte' },
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Image (facultative)' },
        {
          type: 'row',
          fields: [
            { name: 'price', type: 'text', label: 'Prix affiché (ex. 45 000 FCFA, Gratuit)' },
            { name: 'priceNote', type: 'text', label: 'Précision (ex. 4 semaines · places limitées)' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'buttonLabel', type: 'text', label: 'Texte du bouton' },
            {
              name: 'buttonStyle',
              type: 'select',
              label: 'Couleur du bouton',
              defaultValue: 'beige',
              options: [
                { label: 'Discret (beige)', value: 'beige' },
                { label: 'Mis en avant (terre cuite)', value: 'accent' },
              ],
            },
          ],
        },
        {
          name: 'link',
          type: 'text',
          label: 'Lien du bouton',
          validate: isLink,
          admin: {
            description:
              'Une page du site (ex. /a-propos#contact) ou une adresse complète (ex. https://wa.me/229…). Les adresses externes s’ouvrent dans un nouvel onglet. Sans lien, la carte s’affiche sans bouton.',
            condition: (_, sibling) => sibling?.kind === 'autre',
          },
        },
      ],
    },
  ],
}

/* ───────────── Accompagnement CONCEPT ───────────── */

export const Coaching: GlobalConfig = {
  slug: 'coaching',
  label: 'Accompagnement CONCEPT',
  admin: {
    group: 'Mon site',
    hideAPIURL: true,
    components: {
      elements: {
        Description: { path: '/components/admin/Description#Description', clientProps: { text: 'Le tarif, les objectifs, les modalités, et les mois ouverts avec le nombre de places affichées.' } },
      },
    },
  },
  access,
  fields: [
    { name: 'title', type: 'text', label: 'Titre', defaultValue: 'Accompagnement CONCEPT' },
    { name: 'intro', type: 'textarea', label: 'Accroche' },
    {
      type: 'row',
      fields: [
        { name: 'price', type: 'text', label: 'Tarif affiché (ex. 250 €)' },
        { name: 'durationWeeks', type: 'number', label: 'Durée (semaines)', defaultValue: 4 },
      ],
    },
    {
      type: 'collapsible',
      label: 'Paiement par carte',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'payByCard',
          type: 'checkbox',
          label: 'Envoyer un lien de paiement par carte à la confirmation',
          defaultValue: false,
          admin: {
            description:
              'Quand vous passez une réservation en « Confirmée », l’email au participant contient un lien pour régler en ligne.',
          },
        },
        {
          type: 'row',
          fields: [
            { name: 'priceAmount', type: 'number', label: 'Montant encaissé (nombre seul, ex. 250)', min: 0 },
            { name: 'currency', type: 'select', label: 'Devise', defaultValue: 'eur', options: [...CURRENCIES] },
          ],
        },
      ],
    },
    { name: 'description', type: 'richText', label: 'Fonctionnement' },
    {
      name: 'objectives',
      type: 'array',
      label: 'Objectifs',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'modalities',
      type: 'array',
      label: 'Modalités',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'months',
      type: 'array',
      label: 'Mois ouverts à la réservation',
      labels: { singular: 'Mois', plural: 'Mois' },
      admin: {
        description:
          'Les places restantes sont calculées automatiquement avec les réservations (hors annulées). « Places affichées » permet d’afficher un nombre plus bas que la capacité réelle ; le site n’affiche jamais plus de places que celles réellement disponibles.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'month',
              type: 'text',
              label: 'Mois (AAAA-MM)',
              required: true,
              validate: (v: unknown) =>
                /^\d{4}-(0[1-9]|1[0-2])$/.test(String(v ?? '')) || 'Format attendu : 2026-12',
            },
            { name: 'capacity', type: 'number', label: 'Capacité réelle', defaultValue: 4, min: 0 },
            { name: 'displayedPlaces', type: 'number', label: 'Places affichées (optionnel)', min: 0 },
            { name: 'open', type: 'checkbox', label: 'Ouvert', defaultValue: true },
          ],
        },
      ],
    },
  ],
}

/* ───────────── Rendez-vous ───────────── */

export const AppointmentSettings: GlobalConfig = {
  slug: 'appointment-settings',
  label: 'Mes disponibilités (rendez-vous)',
  admin: {
    group: 'Mon site',
    hideAPIURL: true,
    components: {
      elements: {
        Description: { path: '/components/admin/Description#Description', clientProps: { text: 'Les jours et créneaux proposés aux visiteurs pour un rendez-vous gratuit.' } },
      },
    },
  },
  access,
  fields: [
    { name: 'title', type: 'text', label: 'Titre', defaultValue: 'Rendez-vous architectural' },
    { name: 'intro', type: 'textarea', label: 'Présentation du service' },
    {
      type: 'row',
      fields: [
        { name: 'durationMinutes', type: 'number', label: 'Durée (minutes)', defaultValue: 30 },
        { name: 'daysAhead', type: 'number', label: 'Réservable jusqu’à (jours)', defaultValue: 30 },
        { name: 'minNoticeDays', type: 'number', label: 'Délai minimum (jours)', defaultValue: 1 },
      ],
    },
    {
      name: 'timezoneLabel',
      type: 'text',
      label: 'Fuseau horaire affiché',
      defaultValue: 'heure de Paris',
    },
    {
      name: 'weekdays',
      type: 'select',
      label: 'Jours de disponibilité',
      hasMany: true,
      defaultValue: ['2', '4', '6'],
      options: [
        { label: 'Lundi', value: '1' },
        { label: 'Mardi', value: '2' },
        { label: 'Mercredi', value: '3' },
        { label: 'Jeudi', value: '4' },
        { label: 'Vendredi', value: '5' },
        { label: 'Samedi', value: '6' },
        { label: 'Dimanche', value: '0' },
      ],
    },
    {
      name: 'slots',
      type: 'array',
      label: 'Créneaux horaires proposés',
      labels: { singular: 'Créneau', plural: 'Créneaux' },
      fields: [
        {
          name: 'time',
          type: 'text',
          label: 'Heure (HH:MM)',
          required: true,
          validate: (v: unknown) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v ?? '')) || 'Format attendu : 14:30',
        },
      ],
    },
    {
      name: 'blockedDates',
      type: 'array',
      label: 'Jours indisponibles (congés, déplacements…)',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } },
        },
      ],
    },
  ],
}

/* ───────────── À propos ───────────── */

export const AboutPage: GlobalConfig = {
  slug: 'about',
  label: 'Page À propos',
  admin: {
    group: 'Mon site',
    hideAPIURL: true,
    components: {
      elements: {
        Description: { path: '/components/admin/Description#Description', clientProps: { text: 'Votre présentation, votre parcours, vos collaborateurs, vos partenaires et vos coordonnées. Votre photo de profil se change ici.' } },
      },
    },
  },
  access,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'InHabit_Archi',
          fields: [
            { name: 'title', type: 'text', label: 'Titre', defaultValue: 'Habiter, questionner, transmettre.' },
            { name: 'intro', type: 'textarea', label: 'Présentation' },
            { name: 'history', type: 'richText', label: 'Historique et origine de la chaîne' },
            { name: 'vision', type: 'richText', label: 'Vision et philosophie architecturale' },
          ],
        },
        {
          label: 'Fondateur',
          fields: [
            {
              name: 'founder',
              type: 'group',
              label: false,
              fields: [
                { name: 'name', type: 'text', label: 'Nom', defaultValue: 'Warren Riad AYITOU' },
                { name: 'role', type: 'text', label: 'Rôle', defaultValue: 'Architecte & auteur' },
                { name: 'photo', type: 'upload', relationTo: 'media', label: 'Photo' },
                { name: 'bio', type: 'richText', label: 'Biographie' },
              ],
            },
          ],
        },
        {
          label: 'Équipe & partenaires',
          fields: [
            {
              name: 'collaborators',
              type: 'array',
              label: 'Collaborateurs et contributeurs',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', label: 'Nom', required: true },
                    { name: 'role', type: 'text', label: 'Rôle' },
                  ],
                },
                { name: 'photo', type: 'upload', relationTo: 'media' },
                { name: 'link', type: 'text', label: 'Lien (LinkedIn, portfolio…)' },
              ],
            },
            {
              name: 'partners',
              type: 'array',
              label: 'Références et partenaires',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', label: 'Nom', required: true },
                    { name: 'url', type: 'text', label: 'Site web' },
                  ],
                },
                { name: 'logo', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
