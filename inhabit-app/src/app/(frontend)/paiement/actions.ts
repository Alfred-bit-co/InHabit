'use server'

import { redirect } from 'next/navigation'
import { getMember } from '@/lib/member'
import { getPayloadClient, mediaUrl } from '@/lib/payload'
import { checkoutPath, isCardPayable } from '@/lib/payments/editions'
import { isCurrency } from '@/lib/payments/money'
import { newOrderReference } from '@/lib/payments/orders'
import { getPaymentProvider, siteUrl } from '@/lib/payments/provider'
import { verifyCoachingPayToken } from '@/lib/payments/tokens'

const SUCCESS = () => `${siteUrl()}/paiement/merci?session_id={CHECKOUT_SESSION_ID}`

/**
 * Achat d'une édition du livre. Le prix est TOUJOURS relu dans l'admin, côté serveur :
 * le navigateur n'envoie que l'identifiant de l'édition.
 */
export async function payBookEdition(fd: FormData) {
  const editionId = String(fd.get('edition') ?? '')
  const provider = getPaymentProvider()
  const payload = await getPayloadClient()
  const book = await payload.findGlobal({ slug: 'book', depth: 1 })
  const edition = (book.editions ?? []).find((e) => e.id === editionId)

  // Page de retour (liste fermée : jamais une adresse fournie par le navigateur).
  // La page de commande n'est utilisée que pour une édition existante.
  const from = fd.get('from')
  const backTo = (status: string) =>
    from === 'abonnement'
      ? `/espace-membre/abonnement?paiement=${status}`
      : from === 'commande' && edition?.id
        ? `${checkoutPath(edition.id)}&paiement=${status}`
        : `/produits/livre-concept?paiement=${status}#editions`
  const loginBack = from === 'abonnement' ? '/espace-membre/abonnement' : edition?.id ? checkoutPath(edition.id) : '/produits/livre-concept#editions'

  if (!provider || !edition || !isCardPayable(edition) || !edition.priceAmount || !isCurrency(edition.currency)) {
    redirect(backTo('indisponible'))
  }

  // Tout achat se fait connecté : chaque paiement est rattaché à un compte (traçabilité)
  const member = await getMember()
  if (!member) redirect(`/espace-membre/connexion?suite=${encodeURIComponent(loginBack)}`)
  // Déjà lecteur à vie : inutile de payer deux fois la version numérique
  if (edition.digitalAccess && !edition.requiresShipping && !edition.accessDays && member.bookAccess && !member.bookAccessUntil) {
    redirect('/espace-membre')
  }

  const label = `${book.title || 'CONCEPT'} — ${edition.name}${edition.format ? ` (${edition.format})` : ''}`
  let url: string
  try {
    const order = await payload.create({
      collection: 'orders',
      data: {
        reference: newOrderReference(),
        status: 'en-attente',
        product: 'livre',
        label,
        amount: edition.priceAmount,
        currency: edition.currency,
        email: member.email,
        customerName: member.name || undefined,
        grantsBookAccess: Boolean(edition.digitalAccess),
        accessDays: edition.digitalAccess && edition.accessDays ? edition.accessDays : undefined,
        editionId,
        member: member.id,
        provider: provider.id,
      },
    })
    const coverUrl = mediaUrl(edition.cover, 'card') || mediaUrl(book.cover, 'card')
    const session = await provider.createCheckout({
      orderId: String(order.id),
      reference: order.reference,
      name: label,
      description: edition.digitalAccess
        ? edition.accessDays
          ? `Accès de ${edition.accessDays} jours à la lecture en ligne dans votre espace membre InHabit.`
          : 'Comprend la lecture en ligne dans votre espace membre InHabit.'
        : undefined,
      amount: edition.priceAmount,
      currency: edition.currency,
      imageUrl: coverUrl?.startsWith('http') ? coverUrl : coverUrl ? `${siteUrl()}${coverUrl}` : null,
      email: member.email,
      collectShipping: Boolean(edition.requiresShipping),
      successUrl: SUCCESS(),
      cancelUrl: `${siteUrl()}${backTo('annule')}`,
    })
    await payload.update({ collection: 'orders', id: order.id, data: { providerSessionId: session.sessionId }, depth: 0 })
    url = session.url
  } catch (err) {
    console.error('[paiement] livre', err)
    redirect(backTo('erreur'))
  }
  redirect(url)
}

/** Règlement d'une réservation d'accompagnement confirmée (lien reçu par email). */
export async function payCoaching(fd: FormData) {
  const ref = String(fd.get('ref') ?? '')
  const key = String(fd.get('k') ?? '')
  const provider = getPaymentProvider()
  if (!provider || !ref || !verifyCoachingPayToken(ref, key)) redirect('/produits/accompagnement?paiement=indisponible')

  const back = `/paiement/accompagnement?ref=${ref}&k=${key}`
  const member = await getMember()
  if (!member) redirect(`/espace-membre/connexion?suite=${encodeURIComponent(back)}`)

  const payload = await getPayloadClient()
  const [coaching, booking] = await Promise.all([
    payload.findGlobal({ slug: 'coaching', depth: 0 }),
    payload.findByID({ collection: 'coaching-bookings', id: ref, depth: 0, disableErrors: true }),
  ])
  if (!booking || booking.status !== 'confirmee') redirect('/produits/accompagnement?paiement=indisponible')
  if (booking.paymentStatus === 'payee' || booking.paymentStatus === 'autre') {
    redirect(`/paiement/accompagnement?ref=${ref}&k=${key}`)
  }
  if (!coaching.payByCard || !coaching.priceAmount || !isCurrency(coaching.currency)) {
    redirect('/produits/accompagnement?paiement=indisponible')
  }

  const label = `${coaching.title || 'Accompagnement CONCEPT'} — ${booking.month}`
  let url: string
  try {
    const order = await payload.create({
      collection: 'orders',
      data: {
        reference: newOrderReference(),
        status: 'en-attente',
        product: 'accompagnement',
        label,
        amount: coaching.priceAmount,
        currency: coaching.currency,
        email: member.email,
        customerName: booking.name,
        coachingBooking: booking.id,
        member: member.id,
        provider: provider.id,
      },
    })
    const session = await provider.createCheckout({
      orderId: String(order.id),
      reference: order.reference,
      name: label,
      description: `${coaching.durationWeeks ?? 4} semaines de suivi individuel.`,
      amount: coaching.priceAmount,
      currency: coaching.currency,
      email: member.email,
      successUrl: SUCCESS(),
      cancelUrl: `${siteUrl()}/paiement/accompagnement?ref=${ref}&k=${key}&paiement=annule`,
    })
    await payload.update({ collection: 'orders', id: order.id, data: { providerSessionId: session.sessionId }, depth: 0 })
    url = session.url
  } catch (err) {
    console.error('[paiement] accompagnement', err)
    redirect(`/paiement/accompagnement?ref=${ref}&k=${key}&paiement=erreur`)
  }
  redirect(url)
}
