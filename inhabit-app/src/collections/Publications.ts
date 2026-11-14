import type { CollectionConfig } from 'payload'
import { isLoggedIn, publishedOrLoggedIn } from '../access'
import { publishedField, slugField } from '../fields/slug'

export const Publications: CollectionConfig = {
  slug: 'publications',
  labels: { singular: 'Recherche / publication', plural: 'Recherches & publications' },
  defaultSort: '-date',
  admin: {
    group: 'Mes contenus',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'date', 'published'],
    hideAPIURL: true,
    components: {
      Description: { path: '/components/admin/Description#Description', clientProps: { text: 'Publiez vos études, articles et travaux en cours. Un PDF peut être joint à chaque publication.' } },
    },
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
          label: 'Catégorie',
          required: true,
          defaultValue: 'article',
          options: [
            { label: 'Étude / recherche', value: 'etude' },
            { label: 'Publication', value: 'publication' },
            { label: 'Travail en cours', value: 'en-cours' },
            { label: 'Article / réflexion', value: 'article' },
          ],
        },
        {
          name: 'date',
          type: 'date',
          label: 'Date',
          defaultValue: () => new Date().toISOString(),
          admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } },
        },
      ],
    },
    { name: 'summary', type: 'textarea', label: 'Résumé', required: true },
    { name: 'cover', type: 'upload', relationTo: 'media', label: 'Image' },
    { name: 'content', type: 'richText', label: 'Texte complet' },
    { name: 'file', type: 'upload', relationTo: 'media', label: 'Document PDF (optionnel)' },
    { name: 'externalUrl', type: 'text', label: 'Lien externe (revue, éditeur…)' },
    slugField(),
    publishedField,
  ],
}
