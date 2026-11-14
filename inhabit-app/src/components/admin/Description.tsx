import React from 'react'

/**
 * Courte description « Ce que vous pouvez faire ici », affichée en haut d'une liste ou d'une page de l'admin.
 * Le texte est passé dans la configuration (clientProps), ce qui ne modifie pas payload-types.ts.
 */
export function Description({ text }: { text?: string }) {
  if (!text) return null
  return <p className="ih-desc">{text}</p>
}
