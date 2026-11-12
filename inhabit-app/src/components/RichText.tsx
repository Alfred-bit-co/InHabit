import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

/** Affiche un champ « texte riche » saisi dans l'admin. */
export function RichText({ data, className = 'prose' }: { data?: unknown; className?: string }) {
  const state = data as SerializedEditorState | null | undefined
  if (!state?.root?.children?.length) return null
  return <LexicalRichText data={state} className={className} />
}
