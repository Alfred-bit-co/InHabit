import type { Access, FieldAccess } from 'payload'

/**
 * Deux types de comptes coexistent :
 * - « users » : les administrateurs (accès à /admin et à tout le contenu) ;
 * - « members » : les lecteurs inscrits sur le site (espace membre).
 * Un membre connecté ne doit JAMAIS obtenir les droits d'un administrateur :
 * on vérifie donc la collection du compte, pas seulement qu'il est connecté.
 */
type MaybeUser = { collection?: string } | null | undefined

export const isAdminUser = (user: MaybeUser) => user?.collection === 'users'
export const isMemberUser = (user: MaybeUser) => user?.collection === 'members'

/** Seul un administrateur connecté. */
export const isAdmin: Access = ({ req }) => isAdminUser(req.user)

/** Ancien nom, conservé : signifie « administrateur connecté ». */
export const isLoggedIn = isAdmin

/** Champ modifiable uniquement par un administrateur. */
export const adminFieldOnly: FieldAccess = ({ req }) => isAdminUser(req.user)

/** Tout le monde (lecture publique). */
export const anyone: Access = () => true

/** Public : uniquement les contenus publiés. Admin : tout. */
export const publishedOrLoggedIn: Access = ({ req }) =>
  isAdminUser(req.user) ? true : { published: { equals: true } }

/** Administrateur : tout. Membre : uniquement son propre compte. */
export const adminOrSelf: Access = ({ req }) => {
  if (isAdminUser(req.user)) return true
  if (isMemberUser(req.user) && req.user) return { id: { equals: req.user.id } }
  return false
}

/** Réglages communs aux collections de demandes (formulaires du site). */
export const adminOnly = {
  create: isAdmin,
  read: isAdmin,
  update: isAdmin,
  delete: isAdmin,
}
