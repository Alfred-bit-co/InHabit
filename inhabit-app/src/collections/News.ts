import type { CollectionConfig } from 'payload'
import { isLoggedIn, publishedOrLoggedIn } from '../access'
import { publishedField, slugField } from '../fields/slug'

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'Actualité', plural: 'Actualités' },
  defaultSort: '-date',
  admin: {
    group: 'Contenu',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'date', 'published'],
    description: 'Concours en cours, événements, conférences et annonces affichés sur l’accueil.',
  },
  access: { read: publishedOrLoggedIn, create: isLoggedIn, update: isLoggedIn, delete: isLoggedIn },
  fields: [
    { name: 'title', type: 'text', label: 'Titre', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          label: 'Type',
          required: true,
          defaultValue: 'annonce',
          options: [
            { label: 'Annonce', value: 'annonce' },
            { label: 'Concours', value: 'concours' },
            { label: 'Événement', value: 'evenement' },
            { label: 'Conférence', value: 'conference' },
          ],
        },
        {
          name: 'date',
          type: 'date',
          label: 'Date',
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } },
        },
      ],
    },
    { name: 'excerpt', type: 'textarea', label: 'Résumé court', required: true },
    { name: 'cover', type: 'upload', relationTo: 'media', label: 'Image' },
    { name: 'content', type: 'richText', label: 'Contenu détaillé' },
    { name: 'link', type: 'text', label: 'Lien externe (inscription, billetterie…)' },
    slugField(),
    publishedField,
  ],
}
