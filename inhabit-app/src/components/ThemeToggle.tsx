'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

/** Script exécuté avant l'affichage : applique le mode choisi (ou celui de l'appareil) sans flash. */
export const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})()`

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    setTheme((document.documentElement.getAttribute('data-theme') as Theme) || 'light')
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const root = document.documentElement
    root.classList.add('theme-switching')
    root.setAttribute('data-theme', next)
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* stockage indisponible : le choix vaut pour cette visite */
    }
    setTheme(next)
    window.setTimeout(() => root.classList.remove('theme-switching'), 600)
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Passer en mode jour' : 'Passer en mode nuit'}
      title={theme === 'dark' ? 'Mode jour' : 'Mode nuit'}
    >
      <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
      </svg>
      <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1Z" />
      </svg>
    </button>
  )
}
