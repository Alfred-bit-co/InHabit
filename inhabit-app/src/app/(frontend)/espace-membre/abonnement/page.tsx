import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { logoutMember } from '@/app/(frontend)/espace-membre/actions'
import { payBookEdition } from '@/app/(frontend)/paiement/actions'
import { AuthShell } from '@/components/member/AuthShell'
import { PayButton } from '@/components/payments/PayButton'
import { PayNotice } from '@/components/payments/PayNotice'
import { hasBookAccess } from '@/lib/bookAccess'
import { formatShortDate } from '@/lib/dates'
import { firstName, requireMember } from '@/lib/member'
import { getPayloadClient } from '@/lib/payload'
import { formatMoney } from '@/lib/payments/money'
import { paymentsEnabled } from '@/lib/payments/provider'

export const metadata: Metadata = { title: 'Espace membre — abonnement', robots: { index: false } }
export const dynamic = 'force-dynamic'

/** Paiements démarrés dans la dernière heure (confirmation peut-être en route). */
const recentSince = () => new Date(Date.now() - 3_600_000).toISOString()

/**
 * Seule page de l'espace membre ouverte à un compte SANS abonnement actif.
 * Le compte (email ou Google) existe, mais rien n'est lisible avant un paiement confirmé.
 */
export default async function SubscribePage({ searchParams }: { searchParams: Promise<{ paiement?: string }> }) {
  const member = await requireMember('/espace-membre/abonnement')
  if (hasBookAccess(member)) redirect('/espace-membre')

  const { paiement } = await searchParams
  const payload = await getPayloadClient()
  const [book, pending] = await Promise.all([
    payload.findGlobal({ slug: 'book', depth: 0 }),
    payload.count({
      collection: 'orders',
      where: {
        and: [
          { member: { equals: member.id } },
          { status: { equals: 'en-attente' } },
          { grantsBookAccess: { equals: true } },
          { createdAt: { greater_than: recentSince() } },
        ],
      },
    }),
  ])

  const cardPayments = paymentsEnabled()
  const offers = (book.editions ?? []).filter(
    (ed) => ed.digitalAccess && ed.available !== false && ed.payByCard && ed.priceAmount && ed.id,
  )
  const expired = Boolean(member.bookAccess && member.bookAccessUntil)

  return (
    <AuthShell>
      <span className="eyebrow">Abonnement</span>
      <h1 className="auth-title">
        {expired ? 'Votre abonnement est terminé.' : `Bienvenue, ${firstName(member)}.`}
      </h1>
      <p className="muted">
        {expired
          ? `Votre accès a pris fin le ${formatShortDate(member.bookAccessUntil)}. Renouvelez-le pour retrouver votre lecture, vos marque-pages et votre progression.`
          : `Votre compte est créé. L’espace membre et la lecture de ${book.title || 'CONCEPT'} s’ouvrent dès que votre paiement est confirmé.`}
      </p>

      <PayNotice status={paiement} />

      {pending.totalDocs > 0 && (
        <p className="form-status ok" role="status">
          Vous venez de payer ? La confirmation peut prendre quelques instants.{' '}
          <Link href="/espace-membre/abonnement" style={{ textDecoration: 'underline' }}>
            Actualiser
          </Link>
        </p>
      )}

      {cardPayments && offers.length > 0 ? (
        <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
          {offers.map((ed) => (
            <form key={ed.id} action={payBookEdition} className="pay-box">
              <input type="hidden" name="edition" value={ed.id ?? ''} />
              <input type="hidden" name="from" value="abonnement" />
              <div>
                <strong>{ed.name}</strong>
                {ed.format && <span className="muted">{ed.format}</span>}
                <span className="pay-box-amount">{formatMoney(ed.priceAmount, ed.currency)}</span>
                <span className="muted edition-note">
                  {ed.accessDays ? `Accès de ${ed.accessDays} jours à l’espace membre` : 'Accès à vie à l’espace membre'}
                  {ed.requiresShipping ? ' + livre imprimé livré chez vous' : ''}
                </span>
              </div>
              <PayButton className="btn btn-accent">
                {expired ? 'Renouveler par carte' : 'Payer par carte'} <span className="arrow">→</span>
              </PayButton>
            </form>
          ))}
          <p className="form-note pay-secure">
            <LockIcon /> Paiement sécurisé : vos informations bancaires sont saisies sur la page de notre prestataire,
            jamais sur ce site.
          </p>
        </div>
      ) : (
        <p className="form-note" style={{ marginTop: 12 }}>
          Le paiement en ligne ouvre très bientôt. Pour obtenir votre accès dès maintenant,{' '}
          <Link href="/a-propos#contact">écrivez-nous</Link>.
        </p>
      )}

      <div className="auth-actions" style={{ marginTop: 20 }}>
        <Link href="/produits/livre-concept" className="link-arrow">
          Découvrir le livre
        </Link>
        <form action={logoutMember}>
          <button type="submit" className="back-link" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit' }}>
            Se déconnecter ({member.email})
          </button>
        </form>
      </div>
    </AuthShell>
  )
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}
