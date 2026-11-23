import type { CollectionConfig } from 'payload'
import { adminOnly, isAdminUser } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Compte administrateur', plural: 'Comptes administrateurs' },
  admin: {
    useAsTitle: 'email',
    group: 'Réglages',
    defaultColumns: ['email', 'name'],
    hideAPIURL: true,
    components: {
      Description: { path: '/components/admin/Description#Description', clientProps: { text: 'Les personnes qui peuvent se connecter à cet espace. Ajoutez un compte par personne.' } },
    },
  },
  // Explicite : sans cela, Payload autorise tout compte connecté… y compris un membre du site.
  access: { ...adminOnly, admin: ({ req }) => isAdminUser(req.user) },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  fields: [{ name: 'name', type: 'text', label: 'Nom' }],
}
