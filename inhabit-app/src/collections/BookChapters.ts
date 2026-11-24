import type { Access, CollectionConfig, Where } from 'payload'
import { isAdmin, isAdminUser, isMemberUser } from '../access'
import { type AccessFields, hasBookAccess } from '../lib/bookAccess'

/**
 * Qui peut lire un chapitre :
 * - administrateur : tout ;
 * - membre abonné (accès payé et en cours) : les chapitres publiés ;
 * - personne d'autre : ni les visiteurs, ni les inscrits qui n'ont pas payé.
 */
const readChapters: Access = ({ req }) => {
  if (isAdminUser(req.user)) return true
  const published: Where = { published: { equals: true } }
  if (isMemberUser(req.user) && hasBookAccess(req.user as AccessFields)) return published
  return false
}

export const BookChapters: CollectionConfig = {
  slug: 'book-chapters',
  labels: { singular: 'Chapitre du livre', plural: 'Livre CONCEPT — lecture en ligne' },
  defaultSort: 'number',
  admin: {
    group: 'Mes contenus',
    useAsTitle: 'title',
    defaultColumns: ['number', 'title', 'published'],
    hideAPIURL: true,
    components: {
      Description: {
        path: '/components/admin/Description#Description',
        clientProps: {
          text: 'Le texte du livre, chapitre par chapitre, lu dans l’espace membre. Seuls les membres abonnés (paiement confirmé) peuvent le lire.',
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
      label: 'Extrait offert',
      defaultValue: false,
      // Plus utilisé : l'espace membre est réservé aux abonnés (colonne gardée en base)
      admin: { hidden: true },
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
