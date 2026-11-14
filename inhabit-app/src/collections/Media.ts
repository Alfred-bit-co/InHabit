import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Média', plural: 'Médiathèque' },
  admin: {
    group: 'Réglages',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    hideAPIURL: true,
    components: {
      Description: { path: '/components/admin/Description#Description', clientProps: { text: 'Toutes les images et tous les PDF du site. Pensez à décrire chaque image (utile pour l’accessibilité et Google).' } },
    },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Description de l’image (accessibilité)',
      required: true,
    },
  ],
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
    imageSizes: [
      { name: 'thumb', width: 480 },
      { name: 'card', width: 960 },
      { name: 'large', width: 1920 },
    ],
    adminThumbnail: 'thumb',
  },
}
