/* eslint-disable @next/next/no-img-element */
import { getPayloadClient, isMedia, mediaAlt, mediaUrl } from '@/lib/payload'

/** Mise en page des écrans de connexion : visuel du livre à gauche, formulaire à droite. */
export async function AuthShell({ children }: { children: React.ReactNode }) {
  const payload = await getPayloadClient()
  const book = await payload.findGlobal({ slug: 'book', depth: 1 })
  return (
    <section className="section-tight">
      <div className="container">
        <div className="auth-shell">
          <aside className="auth-visual">
            <span className="eyebrow">Espace membre</span>
            <p className="auth-visual-title">
              Lire <em>{book.title || 'CONCEPT'}</em>, où que vous soyez.
            </p>
            <ul className="auth-perks">
              <li>Le livre en ligne, page après page</li>
              <li>Votre lecture reprend là où vous l’avez laissée</li>
              <li>Vos marque-pages et vos achats au même endroit</li>
            </ul>
            {isMedia(book.cover) && (
              <img className="auth-cover" src={mediaUrl(book.cover, 'card') ?? ''} alt={mediaAlt(book.cover, 'Couverture du livre')} />
            )}
          </aside>
          <div className="auth-main">{children}</div>
        </div>
      </div>
    </section>
  )
}
