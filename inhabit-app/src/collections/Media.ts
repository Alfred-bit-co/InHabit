import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Média', plural: 'Médiathèque' },
  admin: { group: 'Contenu', defaultColumns: ['filename', 'alt', 'updatedAt'] },
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
