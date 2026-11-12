/** Bandeau de mots qui défile en continu. */
export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items]
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[...row, ...row].map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  )
}
