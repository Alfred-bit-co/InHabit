/** Texte dont chaque lettre monte à l'affichage (animation CSS, sans JavaScript). */
export function SplitText({ text, base = 0, className }: { text: string; base?: number; className?: string }) {
  return (
    <span className={`split-line${className ? ` ${className}` : ''}`} style={{ ['--base' as string]: `${base}s` }} aria-hidden="true">
      {[...text].map((ch, i) => (
        <span key={i} className="split-char" style={{ ['--i' as string]: i }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  )
}
