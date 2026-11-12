import type { Field } from 'payload'

export const toSlug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Champ « slug » rempli automatiquement à partir du titre. */
export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  label: 'Adresse (slug)',
  index: true,
  unique: true,
  admin: {
    position: 'sidebar',
    description: 'Généré automatiquement à partir du titre si vous le laissez vide.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === 'string' && value) return toSlug(value)
        const source = data?.[from]
        return typeof source === 'string' ? toSlug(source) : value
      },
    ],
  },
})

/** Case « Publié » placée dans la barre latérale. */
export const publishedField: Field = {
  name: 'published',
  type: 'checkbox',
  label: 'Publié sur le site',
  defaultValue: true,
  admin: { position: 'sidebar' },
}
