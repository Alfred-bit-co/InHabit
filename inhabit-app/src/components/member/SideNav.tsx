'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutMember } from '@/app/(frontend)/espace-membre/actions'
import { IconBag, IconBook, IconBookmark, IconLibrary, IconLogout, IconUser } from './icons'

const ITEMS = [
  { href: '/espace-membre', label: 'Ma bibliothèque', Icon: IconLibrary, exact: true },
  { href: '/espace-membre/lecture', label: 'Lire CONCEPT', Icon: IconBook },
  { href: '/espace-membre/marque-pages', label: 'Marque-pages', Icon: IconBookmark },
  { href: '/espace-membre/achats', label: 'Mes achats', Icon: IconBag },
  { href: '/espace-membre/profil', label: 'Profil', Icon: IconUser },
]

export function SideNav({ bookmarks }: { bookmarks: number }) {
  const pathname = usePathname()
  return (
    <nav className="member-nav" aria-label="Espace membre">
      <ul>
        {ITEMS.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? 'page' : undefined}>
                <span className="member-nav-icon">
                  <Icon />
                </span>
                <span>{label}</span>
                {href.endsWith('marque-pages') && bookmarks > 0 && <span className="member-nav-count">{bookmarks}</span>}
              </Link>
            </li>
          )
        })}
        <li>
          <form action={logoutMember}>
            <button type="submit">
              <span className="member-nav-icon">
                <IconLogout />
              </span>
              <span>Déconnexion</span>
            </button>
          </form>
        </li>
      </ul>
    </nav>
  )
}
