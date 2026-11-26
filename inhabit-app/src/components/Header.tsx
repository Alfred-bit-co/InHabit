'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { NAV } from '@/lib/constants'
import { ThemeToggle } from './ThemeToggle'

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="InHabit — accueil">
      <span className="logo-in">In</span>
      <span>Habit</span>
    </Link>
  )
}

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

export function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)

  // Ferme le menu mobile quand on change de page
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }

  // Fond « verre dépoli » après le haut de page, masqué quand on descend.
  // Le défilement fluide (Lenis) produit de tout petits pas en fin de course :
  // on compare donc à un point d'ancrage, pas à l'image précédente, sinon le
  // dernier petit pas ré-affiche systématiquement l'en-tête.
  useEffect(() => {
    let anchor = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 24)
      if (y <= 400) {
        setHidden(false)
        anchor = y
        return
      }
      if (y > anchor + 8) {
        setHidden(true)
        anchor = y
      } else if (y < anchor - 8) {
        setHidden(false)
        anchor = y
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    // La page derrière le menu mobile ne défile plus tant qu'il est ouvert
    const html = document.documentElement
    html.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      html.style.overflow = ''
    }
  }, [open])

  const cls = ['site-header', scrolled && 'scrolled', hidden && !open && 'hidden', open && 'menu-open']
    .filter(Boolean)
    .join(' ')

  return (
    <>
      {/* data-lenis-prevent : la molette sur le menu ouvert ne fait pas défiler la page */}
      <header className={cls} data-lenis-prevent={open || undefined}>
        <div className="container">
          {/* Tout clic sur un lien ferme le menu, y compris vers la page en cours ou une ancre */}
          <div
            className="header-shell"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('a')) setOpen(false)
            }}
          >
            <Logo />
            <nav id="main-nav" className={`main-nav${open ? ' open' : ''}`} aria-label="Navigation principale">
              <ul>
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={isActive(pathname, item.href) ? 'page' : undefined}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mobile-cta">
                <Link href="/a-propos#contact" className="btn btn-dark">
                  Nous contacter <span className="arrow">→</span>
                </Link>
              </div>
            </nav>
            <div className="header-cta">
              <Link
                href="/espace-membre"
                className="header-account"
                aria-label="Espace membre"
                title="Espace membre"
                aria-current={pathname.startsWith('/espace-membre') ? 'page' : undefined}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" />
                </svg>
              </Link>
              <ThemeToggle />
              <Link href="/a-propos#contact" className="btn btn-beige btn-sm">
                Contacts
              </Link>
              <button
                type="button"
                className="burger"
                aria-expanded={open}
                aria-controls="main-nav"
                aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
                onClick={() => setOpen((v) => !v)}
              >
                <span />
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="header-spacer" aria-hidden="true" />
    </>
  )
}
