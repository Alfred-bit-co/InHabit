import type { CollectionConfig } from 'payload'
import { isLoggedIn, publishedOrLoggedIn } from '../access'
import { publishedField, slugField } from '../fields/slug'
import { countryOptions, OUTSIDE_AFRICA } from '../lib/africa'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Projet architectural', plural: 'Projets architecturaux' },
  defaultSort: 'order',
  admin: {
    group: 'Contenu',
    useAsTitle: 'title',
    defaultColumns: ['title', 'country', 'year', 'status', 'featured', 'published'],
  },
  access: { read: publishedOrLoggedIn, create: isLoggedIn, update: isLoggedIn, delete: isLoggedIn },
  fields: [
    { name: 'title', type: 'text', label: 'Nom du projet', required: true },
    { name: 'summary', type: 'textarea', label: 'Résumé (affiché sur les cartes)', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'country',
          type: 'select',
          label: 'Pays',
          required: true,
          options: countryOptions,
          admin: { description: 'Le pays s’allume sur la carte interactive de l’Afrique.' },
        },
        {
          name: 'countryOther',
          type: 'text',
          label: 'Pays (hors Afrique)',
          admin: { condition: (data) => data?.country === OUTSIDE_AFRICA },
        },
        { name: 'city', type: 'text', label: 'Ville / localisation' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'year', type: 'text', label: 'Année' },
        {
          name: 'status',
          type: 'select',
          label: 'Statut',
          defaultValue: 'realise',
          options: [
            { label: 'Réalisé', value: 'realise' },
            { label: 'En cours', value: 'en-cours' },
            { label: 'Étude / esquisse', value: 'etude' },
            { label: 'Concours', value: 'concours' },
          ],
        },
        { name: 'role', type: 'text', label: 'Mon rôle (ex. architecte associé)' },
      ],
    },
    { name: 'cover', type: 'upload', relationTo: 'media', label: 'Image principale', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Présentation',
          fields: [
            { name: 'context', type: 'textarea', label: 'Contexte' },
            { name: 'program', type: 'textarea', label: 'Programme' },
            { name: 'approach', type: 'richText', label: 'Démarche conceptuelle' },
          ],
        },
        {
          label: 'Galerie',
          fields: [
            {
              name: 'gallery',
              type: 'array',
              label: 'Images, plans, perspectives, photographies',
              labels: { singular: 'Image', plural: 'Images' },
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                {
                  name: 'kind',
                  type: 'select',
                  label: 'Type',
                  defaultValue: 'photo',
                  options: [
                    { label: 'Photographie', value: 'photo' },
                    { label: 'Plan', value: 'plan' },
                    { label: 'Perspective / rendu', value: 'perspective' },
                    { label: 'Dessin / esquisse', value: 'dessin' },
                  ],
                },
                { name: 'caption', type: 'text', label: 'Légende' },
              ],
            },
          ],
        },
      ],
    },
    slugField(),
    publishedField,
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Mettre en avant sur l’accueil',
      defaultValue: false,
      admin: { position: 'sidebar', components: { Cell: '/components/admin/BoolCell#BoolCell' } },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Ordre d’affichage',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Les plus petits nombres s’affichent en premier.' },
    },
  ],
}
