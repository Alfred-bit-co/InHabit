export const CONTACT_REASONS = [
  { label: 'Proposition de partenariat (entreprise)', value: 'partenariat' },
  { label: 'Institution', value: 'institution' },
  { label: 'Collaboration événementielle', value: 'evenement' },
  { label: 'Question', value: 'question' },
  { label: 'Autre', value: 'autre' },
]

export const NAV = [
  { href: '/', label: 'Accueil' },
  { href: '/youtube', label: 'YouTube' },
  { href: '/produits', label: 'Produits' },
  { href: '/projets', label: 'Projets' },
  { href: '/a-propos', label: 'À propos' },
]

export const NEWS_TYPES: Record<string, string> = {
  annonce: 'Annonce',
  concours: 'Concours',
  evenement: 'Événement',
  conference: 'Conférence',
}

export const EVENT_TYPES: Record<string, string> = {
  concours: 'Concours',
  evenement: 'Événement',
  conference: 'Conférence',
}

export const EVENT_STATUS: Record<string, string> = {
  'a-venir': 'À venir',
  'en-cours': 'En cours',
  termine: 'Terminé',
}

export const PUBLICATION_TYPES: Record<string, string> = {
  etude: 'Étude / recherche',
  publication: 'Publication',
  'en-cours': 'Travail en cours',
  article: 'Article',
}

export const PROJECT_STATUS: Record<string, string> = {
  realise: 'Réalisé',
  'en-cours': 'En cours',
  etude: 'Étude',
  concours: 'Concours',
}
