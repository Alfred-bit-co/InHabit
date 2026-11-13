import React from 'react'

/* Affiche « Oui / Non » en pastille dans les listes, au lieu de « vrai / faux ». */
export function BoolCell({ cellData }: { cellData?: unknown }) {
  const yes = Boolean(cellData)
  return <span className={`ih-bool${yes ? ' yes' : ''}`}>{yes ? 'Oui' : 'Non'}</span>
}
