import Link from 'next/link'

const ITEMS = [
  { key: 'overview', href: '/produits', label: 'Vue d’ensemble' },
  { key: 'livre', href: '/produits/livre-concept', label: 'Livre CONCEPT' },
  { key: 'accompagnement', href: '/produits/accompagnement', label: 'Accompagnement' },
  { key: 'rdv', href: '/produits/rendez-vous', label: 'Rendez-vous gratuit' },
]

export function ProductsNav({ current }: { current: string }) {
  return (
    <nav className="filters subnav" aria-label="Produits et services">
      {ITEMS.map((i) => (
        <Link key={i.key} href={i.href} aria-current={current === i.key ? 'page' : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  )
}

const P_ITEMS = [
  { key: 'projets', href: '/projets', label: 'Projets architecturaux' },
  { key: 'recherche', href: '/projets/recherche', label: 'Recherche & publications' },
  { key: 'concours', href: '/projets/concours', label: 'Concours & événements' },
]

export function ProjectsNav({ current }: { current: string }) {
  return (
    <nav className="filters subnav" aria-label="Rubriques projets">
      {P_ITEMS.map((i) => (
        <Link key={i.key} href={i.href} aria-current={current === i.key ? 'page' : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  )
}
