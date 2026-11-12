import type { CollectionConfig } from 'payload'
import { anyone, isLoggedIn } from '../access'
import { parseYoutubeId } from '../lib/youtube-id'

export const VideoThemes: CollectionConfig = {
  slug: 'video-themes',
  labels: { singular: 'Thématique vidéo', plural: 'Thématiques vidéo' },
  defaultSort: 'order',
  admin: { group: 'YouTube', useAsTitle: 'name', defaultColumns: ['name', 'order'] },
  access: { read: anyone, create: isLoggedIn, update: isLoggedIn, delete: isLoggedIn },
  fields: [
    { name: 'name', type: 'text', label: 'Nom', required: true },
    { name: 'description', type: 'textarea', label: 'Description' },
    { name: 'order', type: 'number', label: 'Ordre', defaultValue: 0 },
  ],
}

export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Vidéo', plural: 'Vidéos' },
  defaultSort: '-publishedAt',
  admin: {
    group: 'YouTube',
    useAsTitle: 'title',
    defaultColumns: ['title', 'theme', 'publishedAt', 'featured'],
    description:
      'Les dernières vidéos de la chaîne s’affichent automatiquement. Ajoutez ici les vidéos à classer par thématique ou à mettre en avant.',
  },
  access: { read: anyone, create: isLoggedIn, update: isLoggedIn, delete: isLoggedIn },
  fields: [
    {
      name: 'url',
      type: 'text',
      label: 'Lien YouTube',
      required: true,
      admin: { description: 'Collez simplement l’adresse de la vidéo (youtube.com/watch?v=… ou youtu.be/…).' },
      validate: (value: unknown) =>
        parseYoutubeId(String(value ?? '')) ? true : 'Lien YouTube non reconnu.',
    },
    { name: 'youtubeId', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'title', type: 'text', label: 'Titre', required: true },
    { name: 'description', type: 'textarea', label: 'Description courte' },
    {
      name: 'theme',
      type: 'relationship',
      relationTo: 'video-themes',
      label: 'Thématique',
      hasMany: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Date de publication',
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Vidéo à la une (remplace la dernière vidéo sur l’accueil)',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data?.url) data.youtubeId = parseYoutubeId(data.url)
        return data
      },
    ],
  },
}
