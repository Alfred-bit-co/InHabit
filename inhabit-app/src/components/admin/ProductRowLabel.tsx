'use client'

import { useRowLabel } from '@payloadcms/ui'

const KIND_NAMES: Record<string, string> = {
  livre: 'Livre CONCEPT',
  accompagnement: 'Accompagnement CONCEPT',
  'rendez-vous': 'Rendez-vous gratuit',
  autre: 'Nouveau produit',
}

type Row = { kind?: string; title?: string; visible?: boolean }

/** Titre de chaque carte dans la liste « Produits affichés » : numéro, nom, et « masqué » si besoin. */
export function ProductRowLabel() {
  const { data, rowNumber } = useRowLabel<Row>()
  const name = data?.title?.trim() || KIND_NAMES[data?.kind ?? 'autre'] || 'Produit'
  const num = String((rowNumber ?? 0) + 1).padStart(2, '0')
  return (
    <span>
      {num} — {name}
      {data?.visible === false && <span style={{ opacity: 0.6 }}> (masqué)</span>}
    </span>
  )
}
