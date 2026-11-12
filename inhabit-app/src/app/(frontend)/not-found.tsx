import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="page-hero">
      <div className="container">
        <span className="eyebrow">Erreur 404</span>
        <h1>
          Cet espace n’est pas <em>habité</em>.
        </h1>
        <p className="lead">La page demandée n’existe pas ou a été déplacée.</p>
        <Link href="/" className="btn btn-beige" style={{ marginTop: 16 }}>
          Retour à l’accueil
        </Link>
      </div>
    </section>
  )
}
