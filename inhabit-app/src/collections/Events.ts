import type { CollectionConfig } from 'payload'
import { isLoggedIn, publishedOrLoggedIn } from '../access'
import { publishedField, slugField } from '../fields/slug'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Concours / événement', plural: 'Concours & événements' },
  defaultSort: '-startDate',
  admin: {
    group: 'Contenu',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'status', 'startDate', 'published'],
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
          defaultValue: 'concours',
          options: [
            { label: 'Concours InHabit', value: 'concours' },
            { label: 'Événement', value: 'evenement' },
            { label: 'Conférence', value: 'conference' },
          ],
        },
        {
          name: 'status',
          type: 'select',
          label: 'Statut',
          required: true,
          defaultValue: 'a-venir',
          options: [
            { label: 'À venir', value: 'a-venir' },
            { label: 'En cours', value: 'en-cours' },
            { label: 'Terminé', value: 'termine' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          label: 'Date de début',
          admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } },
        },
        {
          name: 'endDate',
          type: 'date',
          label: 'Date de fin / clôture',
          admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } },
        },
        { name: 'location', type: 'text', label: 'Lieu (ou « En ligne »)' },
      ],
    },
    { name: 'summary', type: 'textarea', label: 'Résumé', required: true },
    { name: 'cover', type: 'upload', relationTo: 'media', label: 'Visuel' },
    { name: 'content', type: 'richText', label: 'Présentation' },
    { name: 'modalities', type: 'richText', label: 'Informations pratiques / modalités de participation' },
    { name: 'registrationUrl', type: 'text', label: 'Lien d’inscription' },
    slugField(),
    publishedField,
  ],
}
