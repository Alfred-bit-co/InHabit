import type { Metadata } from 'next'
import Link from 'next/link'
import { PayButton } from '@/components/payments/PayButton'
import { PayNotice } from '@/components/payments/PayNotice'
import { formatMonthFr } from '@/lib/dates'
import { getMember } from '@/lib/member'
import { getPayloadClient } from '@/lib/payload'
import { formatMoney } from '@/lib/payments/money'
import { paymentsEnabled } from '@/lib/payments/provider'
import { verifyCoachingPayToken } from '@/lib/payments/tokens'
import { payCoaching } from '../actions'

export const metadata: Metadata = { title: 'Régler mon accompagnement', robots: { index: false } }

type Params = { ref?: string; k?: string; paiement?: string }

export default async function PayCoachingPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { ref = '', k = '', paiement } = await searchParams
  const valid = Boolean(ref && verifyCoachingPayToken(ref, k))
  const payload = await getPayloadClient()
  const [coaching, booking] = await Promise.all([
    payload.findGlobal({ slug: 'coaching', depth: 0 }),
    valid ? payload.findByID({ collection: 'coaching-bookings', id: ref, depth: 0, disableErrors: true }) : null,
  ])

  const member = await getMember()
  const settled = booking?.paymentStatus === 'payee' || booking?.paymentStatus === 'autre'
  const canPay =
    paymentsEnabled() && booking?.status === 'confirmee' && !settled && coaching.payByCard && Boolean(coaching.priceAmount)

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="panel pay-result">
          <span className="eyebrow">Accompagnement CONCEPT</span>
          {!booking ? (
            <>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Lien de paiement invalide.</h1>
              <p className="lead">Ce lien est incomplet ou a expiré. Écrivez-nous et nous vous en enverrons un nouveau.</p>
              <Link href="/a-propos#contact" className="btn btn-dark">
                Nous contacter <span className="arrow">→</span>
              </Link>
            </>
          ) : settled ? (
            <>
              <span className="pay-result-icon ok" aria-hidden="true">✓</span>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>C’est réglé, merci {booking.name}.</h1>
              <p className="lead">Votre place pour {formatMonthFr(booking.month)} est réservée.</p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Régler ma place.</h1>
              <p className="lead">
                {booking.name}, votre participation pour <strong>{formatMonthFr(booking.month)}</strong> est confirmée.
              </p>
              <PayNotice status={paiement} />
              {canPay && !member ? (
                <div className="pay-box">
                  <div>
                    <strong className="pay-box-amount">{formatMoney(coaching.priceAmount, coaching.currency)}</strong>
                    <span className="muted">Pour payer, connectez-vous ou créez votre compte gratuit.</span>
                  </div>
                  <Link
                    href={`/espace-membre/connexion?suite=${encodeURIComponent(`/paiement/accompagnement?ref=${ref}&k=${k}`)}`}
                    className="btn btn-dark"
                  >
                    Me connecter pour payer <span className="arrow">→</span>
                  </Link>
                </div>
              ) : canPay ? (
                <form action={payCoaching} className="pay-box">
                  <input type="hidden" name="ref" value={ref} />
                  <input type="hidden" name="k" value={k} />
                  <div>
                    <strong className="pay-box-amount">{formatMoney(coaching.priceAmount, coaching.currency)}</strong>
                    <span className="muted">{coaching.durationWeeks ?? 4} semaines · suivi individuel</span>
                  </div>
                  <PayButton className="btn btn-accent">
                    Payer par carte <span className="arrow">→</span>
                  </PayButton>
                  <p className="form-note pay-secure">
                    <LockIcon /> Paiement sécurisé. Vos données bancaires sont saisies chez notre prestataire de paiement,
                    jamais sur ce site.
                  </p>
                </form>
              ) : (
                <p className="muted">
                  Le paiement en ligne n’est pas encore ouvert. Nous vous indiquerons comment régler par email.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
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
