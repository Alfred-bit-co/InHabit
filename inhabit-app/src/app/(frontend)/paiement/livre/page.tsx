/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { GoogleLogo } from '@/components/member/GoogleLogo'
import { PayButton } from '@/components/payments/PayButton'
import { PayNotice } from '@/components/payments/PayNotice'
import { hasBookAccess } from '@/lib/bookAccess'
import { googleEnabled } from '@/lib/google'
import { firstName, getMember } from '@/lib/member'
import { getPayloadClient, isMedia, mediaAlt, mediaUrl } from '@/lib/payload'
import { checkoutPath, isCardPayable } from '@/lib/payments/editions'
import { formatMoney } from '@/lib/payments/money'
import { paymentsEnabled } from '@/lib/payments/provider'
import { payBookEdition } from '../actions'

export const metadata: Metadata = { title: 'Commander le livre', robots: { index: false } }
export const dynamic = 'force-dynamic'

const BOOK_PAGE = '/produits/livre-concept#editions'

/**
 * Page de commande d'une édition, dans le style du site :
 * 1. le compte (connexion, inscription ou Google), 2. le paiement par carte, 3. la lecture.
 * Les numéros de carte ne sont JAMAIS saisis ici : le bouton mène à la page sécurisée de Stripe.
 */
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ edition?: string; paiement?: string }> }) {
  const { edition: editionId = '', paiement } = await searchParams
  const payload = await getPayloadClient()
  const [book, member] = await Promise.all([payload.findGlobal({ slug: 'book', depth: 1 }), getMember()])
  const edition = (book.editions ?? []).find((e) => e.id === editionId)
  if (!edition || !isCardPayable(edition) || !paymentsEnabled()) redirect(`/produits/livre-concept?paiement=indisponible#editions`)

  const here = checkoutPath(editionId)
  const title = book.title || 'CONCEPT'
  const price = formatMoney(edition.priceAmount, edition.currency)
  const cover = isMedia(edition.cover) ? edition.cover : isMedia(book.cover) ? book.cover : null
  const digital = Boolean(edition.digitalAccess)
  // Déjà lecteur à vie : rien à payer pour une version uniquement numérique
  const alreadyReader = Boolean(
    member && digital && !edition.requiresShipping && !edition.accessDays && hasBookAccess(member) && !member.bookAccessUntil,
  )
  const login = (mode?: string) => `/espace-membre/connexion?${new URLSearchParams({ ...(mode ? { mode } : {}), suite: here })}`

  const included = [
    digital && (edition.accessDays ? `${edition.accessDays} jours de lecture en ligne` : 'Lecture en ligne à vie'),
    digital && 'Accès immédiat à votre espace membre',
    digital && 'Reprise de la lecture et marque-pages',
    edition.requiresShipping && 'Livre imprimé livré chez vous',
  ].filter((x): x is string => Boolean(x))

  return (
    <section className="section-tight">
      <div className="container">
        <Link href={BOOK_PAGE} className="back-link">
          ← Retour aux éditions
        </Link>

        <div className="checkout">
          <div className="checkout-main">
            <span className="eyebrow">Commande</span>
            <h1 className="checkout-title">
              {title} — {edition.name}
            </h1>

            <ol className="checkout-steps" aria-label="Étapes de la commande">
              <li className={member ? 'is-done' : 'is-current'} aria-current={member ? undefined : 'step'}>
                <span>{member ? '✓' : '1'}</span> Compte
              </li>
              <li className={member ? 'is-current' : ''} aria-current={member ? 'step' : undefined}>
                <span>2</span> Paiement
              </li>
              <li>
                <span>3</span> {digital ? 'Lecture' : 'Livraison'}
              </li>
            </ol>

            <PayNotice status={paiement} />

            {/* Étape 1 : le compte */}
            <div className="checkout-block">
              <h2 className="checkout-block-title">
                <span className="checkout-num">1</span> Votre compte
              </h2>
              {member ? (
                <div className="checkout-account">
                  <span className="checkout-avatar" aria-hidden="true">
                    {firstName(member).slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <strong>{member.name || firstName(member)}</strong>
                    <span className="muted">{member.email}</span>
                  </div>
                  <span className="tag">Connecté</span>
                </div>
              ) : (
                <>
                  <p className="muted" style={{ marginTop: 0 }}>
                    {digital
                      ? 'Votre achat est rattaché à votre compte : c’est lui qui ouvre votre espace membre et la lecture du livre.'
                      : 'Votre achat est rattaché à votre compte, pour suivre votre commande.'}
                  </p>
                  <div className="checkout-auth">
                    <Link href={login('inscription')} className="btn btn-accent">
                      Créer mon compte <span className="arrow">→</span>
                    </Link>
                    <Link href={login()} className="btn btn-beige">
                      J’ai déjà un compte
                    </Link>
                    {googleEnabled() && (
                      <a href={`/espace-membre/google?${new URLSearchParams({ suite: here })}`} className="btn btn-google">
                        <GoogleLogo /> Continuer avec Google
                      </a>
                    )}
                  </div>
                  <p className="form-note" style={{ margin: '12px 0 0' }}>
                    Une fois connecté, vous revenez directement ici pour payer.
                  </p>
                </>
              )}
            </div>

            {/* Étape 2 : le paiement */}
            <div className={`checkout-block${member ? '' : ' is-locked'}`}>
              <h2 className="checkout-block-title">
                <span className="checkout-num">2</span> Paiement par carte bancaire
              </h2>
              {alreadyReader ? (
                <>
                  <p className="form-status ok" role="status">
                    Vous avez déjà accès à vie à la lecture de {title}. Inutile de payer une seconde fois.
                  </p>
                  <Link href="/espace-membre" className="btn btn-accent">
                    Ouvrir mon espace membre <span className="arrow">→</span>
                  </Link>
                </>
              ) : (
                <div className="checkout-pay">
                  <div className="pay-card" aria-hidden="true">
                    <span className="pay-card-brand">InHabit_Archi</span>
                    <span className="pay-card-chip" />
                    <span className="pay-card-number">•••• •••• •••• ••••</span>
                    <span className="pay-card-foot">
                      <span>{member ? (member.name || firstName(member)).toUpperCase() : 'VOTRE NOM'}</span>
                      <span>MM/AA</span>
                    </span>
                  </div>
                  <div className="checkout-pay-side">
                    <p className="muted" style={{ marginTop: 0 }}>
                      Visa, Mastercard et cartes bancaires acceptées. Vous saisirez votre carte sur la page sécurisée
                      de notre prestataire de paiement, puis vous reviendrez automatiquement sur le site.
                    </p>
                    {member ? (
                      <form action={payBookEdition}>
                        <input type="hidden" name="edition" value={editionId} />
                        <input type="hidden" name="from" value="commande" />
                        <PayButton className="btn btn-accent checkout-pay-btn">
                          <LockIcon /> Payer {price} par carte
                        </PayButton>
                      </form>
                    ) : (
                      <button type="button" className="btn btn-accent checkout-pay-btn" disabled>
                        <LockIcon /> Payer {price} par carte
                      </button>
                    )}
                    <p className="form-note pay-secure" style={{ margin: 0 }}>
                      <LockIcon /> Paiement chiffré et sécurisé (3D Secure). Vos numéros de carte ne passent jamais par
                      ce site.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Étape 3 : après le paiement */}
            <div className="checkout-block is-locked">
              <h2 className="checkout-block-title">
                <span className="checkout-num">3</span> {digital ? 'Votre lecture' : 'Votre livraison'}
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                {digital
                  ? `Dès le paiement confirmé, votre espace membre s’ouvre et vous pouvez lire ${title} en ligne.`
                  : 'Dès le paiement confirmé, nous préparons votre livre et vous recevez un email de confirmation.'}
              </p>
            </div>
          </div>

          {/* Récapitulatif */}
          <aside className="checkout-summary" aria-label="Récapitulatif de la commande">
            {cover && (
              <img className="checkout-cover" src={mediaUrl(cover, 'card') ?? ''} alt={mediaAlt(cover, `Couverture — ${edition.name}`)} />
            )}
            <span className="eyebrow">Votre commande</span>
            <strong className="checkout-summary-name">{edition.name}</strong>
            {edition.format && <span className="muted">{edition.format}</span>}
            {included.length > 0 && (
              <ul className="checkout-included">
                {included.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            <div className="checkout-total">
              <span>Total</span>
              <strong>{price}</strong>
            </div>
            <span className="form-note" style={{ margin: 0 }}>
              Paiement unique{edition.accessDays ? ', sans renouvellement automatique' : ''}.
            </span>
          </aside>
        </div>
      </div>
    </section>
  )
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}
