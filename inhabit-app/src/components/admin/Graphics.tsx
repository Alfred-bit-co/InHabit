import React from 'react'

/* Logo InHabit dans l'admin (page de connexion) — même logo que sur le site. */
export function Logo() {
  return (
    <span className="ih-graphic-logo">
      <span className="ih-graphic-in">In</span>
      <span>
        Habit
        <small>Espace d’administration</small>
      </span>
    </span>
  )
}

/* Petite icône du menu et du fil d'Ariane. */
export function Icon() {
  return <span className="ih-graphic-in sm">In</span>
}

/* Photo de Warren en haut à droite de l'admin (reprise de la page À propos). */
export async function Avatar({ payload }: { payload?: import('payload').Payload }) {
  let src: string | null = null
  try {
    const about = payload ? await payload.findGlobal({ slug: 'about', depth: 1 }) : null
    const photo = about?.founder?.photo
    if (photo && typeof photo === 'object') src = photo.sizes?.thumb?.url || photo.url || null
  } catch {}
  return src ? (
    <img className="ih-graphic-avatar" src={src} alt="" />
  ) : (
    <span className="ih-graphic-avatar ih-graphic-in sm">W</span>
  )
}
