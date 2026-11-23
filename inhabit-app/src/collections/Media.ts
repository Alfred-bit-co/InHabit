import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/** « mon-projet_facade-01.jpg » → « Mon projet facade 01 » */
export const altFromFilename = (filename?: string | null) => {
  const base = (filename || '').replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : 'Image InHabit'
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Média', plural: 'Médiathèque' },
  admin: {
    group: 'Réglages',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    hideAPIURL: true,
    components: {
      Description: { path: '/components/admin/Description#Description', clientProps: { text: 'Toutes les images et tous les PDF du site. Taille maximale : 4 Mo par fichier (au-delà, réduisez la photo avant de l’envoyer). Une courte description de chaque image aide l’accessibilité et Google.' } },
    },
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Description de l’image (accessibilité)',
      // Facultatif : obligatoire, il bloquait l'ajout de plusieurs images d'un coup
      // (seule la première était enregistrée, les autres restaient dans la fenêtre).
      admin: { description: 'Facultatif. Laissée vide, elle est remplie à partir du nom du fichier.' },
      hooks: {
        beforeChange: [
          ({ value, data, originalDoc }) =>
            (typeof value === 'string' && value.trim()) || altFromFilename(data?.filename ?? originalDoc?.filename),
        ],
      },
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
