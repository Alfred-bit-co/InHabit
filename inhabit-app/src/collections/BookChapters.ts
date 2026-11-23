import type { Access, CollectionConfig, Where } from 'payload'
import { isAdmin, isAdminUser, isMemberUser } from '../access'
import { type AccessFields, hasBookAccess } from '../lib/bookAccess'

/**
 * Qui peut lire un chapitre :
 * - administrateur : tout ;
 * - membre ayant acheté le livre numérique : tous les chapitres publiés ;
 * - tout le monde : les chapitres publiés marqués « extrait offert ».
 */
const readChapters: Access = ({ req }) => {
  if (isAdminUser(req.user)) return true
  const published: Where = { published: { equals: true } }
  if (isMemberUser(req.user) && hasBookAccess(req.user as AccessFields)) return published
  return { and: [published, { free: { equals: true } }] }
}

export const BookChapters: CollectionConfig = {
  slug: 'book-chapters',
  labels: { singular: 'Chapitre du livre', plural: 'Livre CONCEPT — lecture en ligne' },
  defaultSort: 'number',
  admin: {
    group: 'Mes contenus',
    useAsTitle: 'title',
    defaultColumns: ['number', 'title', 'free', 'published'],
    hideAPIURL: true,
    components: {
      Description: {
        path: '/components/admin/Description#Description',
        clientProps: {
          text: 'Le texte du livre, chapitre par chapitre, lu par les membres dans leur espace. Cochez « Extrait offert » pour qu’un chapitre soit lisible sans achat.',
        },
      },
    },
  },
  access: { read: readChapters, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'number', type: 'number', label: 'N° du chapitre', required: true, min: 0, index: true },
        { name: 'title', type: 'text', label: 'Titre', required: true },
      ],
    },
    { name: 'part', type: 'text', label: 'Partie (optionnel, ex. « I. Regarder »)' },
    { name: 'content', type: 'richText', label: 'Texte du chapitre', required: true },
    {
      name: 'free',
      type: 'checkbox',
      label: 'Extrait offert (lisible sans achat)',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Publié',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}
