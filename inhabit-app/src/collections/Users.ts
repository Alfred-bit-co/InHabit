import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Administrateur', plural: 'Administrateurs' },
  admin: {
    useAsTitle: 'email',
    group: 'Paramètres',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  fields: [{ name: 'name', type: 'text', label: 'Nom' }],
}
