import type { Access } from 'payload'

/** Seul un administrateur connecté. */
export const isLoggedIn: Access = ({ req }) => Boolean(req.user)

/** Tout le monde (lecture publique). */
export const anyone: Access = () => true

/** Public : uniquement les contenus publiés. Admin : tout. */
export const publishedOrLoggedIn: Access = ({ req }) =>
  req.user ? true : { published: { equals: true } }

/** Réglages communs aux collections de demandes (formulaires du site). */
export const adminOnly = {
  create: isLoggedIn,
  read: isLoggedIn,
  update: isLoggedIn,
  delete: isLoggedIn,
}
