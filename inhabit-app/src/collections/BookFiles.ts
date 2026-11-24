import path from 'path'
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Le livre en PDF, stocké en PRIVÉ.
 * - Personne ne peut le télécharger directement : la lecture « admin » seule est autorisée.
 * - Les lecteurs ayant payé le voient uniquement dans la liseuse de l'espace membre,
 *   par petits morceaux brouillés, avec un filigrane à leur nom (voir /espace-membre/livre).
 * - En ligne, le fichier va dans un bucket Supabase PRIVÉ (variable S3_PRIVATE_BUCKET),
 *   jamais dans le bucket public des images.
 */
export const BookFiles: CollectionConfig = {
  slug: 'book-files',
  labels: { singular: 'Livre (PDF protégé)', plural: 'Livre CONCEPT — PDF protégé' },
  defaultSort: '-createdAt',
  admin: {
    group: 'Mes contenus',
    useAsTitle: 'title',
    defaultColumns: ['title', 'active', 'updatedAt'],
    hideAPIURL: true,
    components: {
      Description: {
        path: '/components/admin/Description#Description',
        clientProps: {
          text: 'Téléversez ici le livre en PDF. Il n’est lisible que par les membres abonnés (paiement confirmé), jamais téléchargeable : il s’affiche seulement dans la liseuse de l’espace membre, avec le nom du lecteur en filigrane. Taille maximale : 50 Mo (au-delà, compressez le PDF avant de l’envoyer).',
        },
      },
    },
  },
  // Lecture réservée à l'administrateur : les membres passent par la liseuse protégée
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  upload: {
    mimeTypes: ['application/pdf'],
    // En local, hors du dossier public (ignoré par Git). En ligne : bucket privé.
    staticDir: path.resolve(process.cwd(), 'private-files/book'),
  },
  fields: [
    { name: 'title', type: 'text', label: 'Titre (ex. CONCEPT — édition française)', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          type: 'select',
          label: 'Type',
          required: true,
          defaultValue: 'complet',
          options: [
            { label: 'Livre complet', value: 'complet' },
            { label: 'Extrait', value: 'extrait' },
          ],
          // Seul le livre complet est lu (réservé aux abonnés) ; colonne gardée en base
          admin: { hidden: true },
        },
        {
          name: 'active',
          type: 'checkbox',
          label: 'En ligne',
          defaultValue: true,
          admin: { description: 'Si plusieurs fichiers sont en ligne, le plus récent est utilisé.' },
        },
      ],
    },
  ],
}
