import type { CollectionConfig } from 'payload'
import { adminFieldOnly, adminOrSelf, isAdmin } from '../access'
import { escapeHtml } from '../lib/escape'

const site = () => (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/$/, '')

export const Members: CollectionConfig = {
  slug: 'members',
  labels: { singular: 'Membre', plural: 'Membres (lecteurs)' },
  defaultSort: '-createdAt',
  admin: {
    group: 'Ventes & membres',
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'bookAccess', 'createdAt'],
    hideAPIURL: true,
    components: {
      Description: {
        path: '/components/admin/Description#Description',
        clientProps: {
          text: 'Les lecteurs inscrits sur le site. L’accès au livre s’ouvre tout seul après paiement ; vous pouvez aussi le donner à la main (cadeau, presse…).',
        },
      },
    },
  },
  access: {
    // Inscription uniquement via le formulaire du site (champs contrôlés côté serveur)
    create: isAdmin,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: isAdmin,
    // Un membre n'entre jamais dans /admin
    admin: () => false,
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30, // 30 jours
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    cookies: { sameSite: 'Lax' },
    forgotPassword: {
      expiration: 60 * 60 * 1000, // 1 heure
      generateEmailSubject: () => 'Choisir un nouveau mot de passe — InHabit_Archi',
      generateEmailHTML: (args) => {
        const token = args?.token ?? ''
        const name = (args?.user as { name?: string } | undefined)?.name
        const url = `${site()}/espace-membre/nouveau-mot-de-passe?token=${encodeURIComponent(token)}`
        return `<p style="font-family:Arial,sans-serif">Bonjour${name ? ` ${escapeHtml(name)}` : ''},</p><p style="font-family:Arial,sans-serif">Pour choisir un nouveau mot de passe, cliquez sur ce lien (valable une heure) :</p><p style="font-family:Arial,sans-serif"><a href="${url}">${url}</a></p><p style="font-family:Arial,sans-serif;color:#888">Si vous n’êtes pas à l’origine de cette demande, ignorez simplement cet email.</p>`
      },
    },
  },
  fields: [
    { name: 'name', type: 'text', label: 'Nom' },
    {
      name: 'bookAccess',
      type: 'checkbox',
      label: 'Accès au livre numérique',
      defaultValue: false,
      // Seul l'administrateur (ou le paiement, côté serveur) peut l'ouvrir
      access: { create: adminFieldOnly, update: adminFieldOnly },
      admin: { position: 'sidebar' },
    },
    {
      name: 'bookAccessUntil',
      type: 'date',
      label: 'Accès valable jusqu’au',
      access: { create: adminFieldOnly, update: adminFieldOnly },
      admin: {
        position: 'sidebar',
        description: 'Vide = accès à vie. Rempli automatiquement pour un abonnement à durée limitée.',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
      },
    },
    {
      type: 'collapsible',
      label: 'Lecture',
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'readingChapter', type: 'relationship', relationTo: 'book-chapters', label: 'Dernier chapitre lu' },
            { name: 'readingPosition', type: 'number', label: 'Position dans le chapitre (0 à 1)', min: 0, max: 1 },
            { name: 'pdfPage', type: 'number', label: 'Dernière page lue (PDF)', min: 1 },
          ],
        },
        {
          name: 'bookmarks',
          type: 'array',
          label: 'Marque-pages',
          labels: { singular: 'Marque-page', plural: 'Marque-pages' },
          maxRows: 200,
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'chapter', type: 'relationship', relationTo: 'book-chapters', label: 'Chapitre (version texte)' },
                { name: 'position', type: 'number', label: 'Position (0 à 1)', min: 0, max: 1 },
                { name: 'page', type: 'number', label: 'Page (PDF)', min: 1 },
              ],
            },
            { name: 'excerpt', type: 'text', label: 'Début du passage' },
            { name: 'createdAt', type: 'date', label: 'Ajouté le' },
          ],
        },
      ],
    },
  ],
}
