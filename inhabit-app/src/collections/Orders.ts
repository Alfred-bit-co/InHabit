import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import { adminOnly } from '../access'
import { getAdminEmail, safeSend } from '../hooks/notify'
import { formatMonthFr } from '../lib/dates'
import { emailTable, escapeHtml } from '../lib/escape'
import { formatEuros, siteUrl } from '../lib/payments/config'

export const ORDER_STATUSES = [
  { label: 'En attente de paiement', value: 'en-attente' },
  { label: 'Payée (à traiter)', value: 'payee' },
  { label: 'Expédiée / terminée', value: 'expediee' },
  { label: 'Annulée (non payée)', value: 'annulee' },
  { label: 'Remboursée', value: 'remboursee' },
]

export const ORDER_PRODUCTS = [
  { label: 'Livre papier', value: 'livre-papier' },
  { label: 'Livre numérique', value: 'livre-numerique' },
  { label: 'Accompagnement CONCEPT', value: 'accompagnement' },
]

const font = 'font-family:Arial,sans-serif'
const p = (html: string) => `<p style="${font}">${html}</p>`
const signature = '<p style="font-family:Arial,sans-serif;color:#888">— InHabit_Archi</p>'
const button = (href: string, label: string) =>
  `<p style="${font}"><a href="${href}" style="display:inline-block;background:#a45428;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none">${escapeHtml(label)}</a></p>`

const addressLines = (d: any) =>
  [
    d.shipping?.name,
    d.shipping?.line1,
    d.shipping?.line2,
    [d.shipping?.postalCode, d.shipping?.city].filter(Boolean).join(' '),
    d.shipping?.state,
    d.shipping?.country,
  ]
    .filter(Boolean)
    .join(', ')

/**
 * Emails envoyés quand le statut d'une commande change :
 * - « Payée » : reçu au client (+ lien de téléchargement pour le livre numérique) et alerte à Warren ;
 * - « Expédiée » : prévient le client que son livre est parti.
 */
const orderStatusMail: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update' || doc.status === previousDoc?.status) return doc
  const first = escapeHtml(String(doc.customerName || '').split(' ')[0] || 'Bonjour')
  const amount = formatEuros(doc.amount)

  if (doc.status === 'payee') {
    const adminEmail = await getAdminEmail(req)
    await safeSend(req, {
      to: adminEmail,
      subject: `[InHabit] Nouvelle commande payée — ${doc.label} (${amount})`,
      html: emailTable([
        ['Référence', doc.reference],
        ['Produit', doc.label],
        ['Montant', amount],
        ['Paiement', doc.provider === 'paypal' ? 'PayPal' : 'Carte bancaire (Stripe)'],
        ['Client', doc.customerName],
        ['Email', doc.customerEmail],
        ['Téléphone', doc.customerPhone],
        ['Livraison', doc.product === 'livre-papier' ? addressLines(doc) : ''],
      ]),
    })

    let body = ''
    if (doc.product === 'livre-numerique') {
      body =
        p(`Merci pour votre achat du livre <strong>${escapeHtml(doc.label)}</strong> (${amount}).`) +
        p('Votre livre est prêt. Le lien ci-dessous reste valable 30 jours :') +
        button(`${siteUrl()}/telechargement/${doc.secret}`, 'Télécharger le livre')
    } else if (doc.product === 'livre-papier') {
      body =
        p(`Merci pour votre commande du livre <strong>${escapeHtml(doc.label)}</strong> (${amount}).`) +
        p(`Il sera expédié à l’adresse suivante : ${escapeHtml(addressLines(doc))}. Vous recevrez un email au moment de l’envoi.`)
    } else {
      body = p(
        `Votre paiement de ${amount} pour l’<strong>Accompagnement CONCEPT</strong>${doc.month ? ` (${escapeHtml(formatMonthFr(doc.month))})` : ''} est bien reçu : votre place est réservée. Vous recevrez prochainement les informations pratiques pour démarrer.`,
      )
    }
    if (doc.customerEmail) {
      await safeSend(req, {
        to: doc.customerEmail,
        subject: `Votre commande InHabit ${doc.reference} est confirmée`,
        html: p(`${first},`) + body + p(`Référence de commande : <strong>${escapeHtml(doc.reference)}</strong>`) + signature,
      })
    }
  }

  if (doc.status === 'expediee' && doc.product === 'livre-papier' && doc.customerEmail) {
    await safeSend(req, {
      to: doc.customerEmail,
      subject: `Votre livre est en route — commande ${doc.reference}`,
      html:
        p(`${first},`) +
        p(`Votre livre <strong>${escapeHtml(doc.label)}</strong> vient d’être expédié.`) +
        (doc.trackingNumber ? p(`Numéro de suivi : <strong>${escapeHtml(doc.trackingNumber)}</strong>`) : '') +
        signature,
    })
  }
  return doc
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Commande', plural: 'Commandes' },
  defaultSort: '-createdAt',
  admin: {
    group: 'Demandes',
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'label', 'customerName', 'amount', 'status', 'createdAt'],
    hideAPIURL: true,
    components: {
      Description: {
        path: '/components/admin/Description#Description',
        clientProps: {
          text: 'Les achats payés sur le site (livre et accompagnement). Livre papier : expédiez-le, puis passez la commande en « Expédiée » pour prévenir le client. Les remboursements se font depuis Stripe ou PayPal.',
        },
      },
    },
  },
  access: adminOnly,
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'reference', type: 'text', label: 'Référence', required: true, unique: true, admin: { readOnly: true } },
        { name: 'product', type: 'select', label: 'Produit', required: true, options: ORDER_PRODUCTS, admin: { readOnly: true } },
      ],
    },
    { name: 'label', type: 'text', label: 'Article', required: true, admin: { readOnly: true } },
    {
      type: 'row',
      fields: [
        { name: 'amount', type: 'number', label: 'Montant total (€)', required: true, admin: { readOnly: true } },
        { name: 'shippingFee', type: 'number', label: 'Dont livraison (€)', admin: { readOnly: true } },
        {
          name: 'provider',
          type: 'select',
          label: 'Moyen de paiement',
          required: true,
          options: [
            { label: 'Carte bancaire (Stripe)', value: 'stripe' },
            { label: 'PayPal', value: 'paypal' },
          ],
          admin: { readOnly: true },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'customerName', type: 'text', label: 'Client' },
        { name: 'customerEmail', type: 'email', label: 'Email' },
        { name: 'customerPhone', type: 'text', label: 'Téléphone' },
      ],
    },
    {
      name: 'shipping',
      type: 'group',
      label: 'Adresse de livraison (livre papier)',
      admin: { condition: (data) => data?.product === 'livre-papier' },
      fields: [
        { name: 'name', type: 'text', label: 'Destinataire' },
        {
          type: 'row',
          fields: [
            { name: 'line1', type: 'text', label: 'Adresse' },
            { name: 'line2', type: 'text', label: 'Complément' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'postalCode', type: 'text', label: 'Code postal' },
            { name: 'city', type: 'text', label: 'Ville' },
            { name: 'state', type: 'text', label: 'Région' },
            { name: 'country', type: 'text', label: 'Pays' },
          ],
        },
      ],
    },
    {
      name: 'trackingNumber',
      type: 'text',
      label: 'Numéro de suivi du colis (facultatif, envoyé au client)',
      admin: { condition: (data) => data?.product === 'livre-papier' },
    },
    {
      name: 'month',
      type: 'text',
      label: 'Mois de l’accompagnement',
      admin: { readOnly: true, condition: (data) => data?.product === 'accompagnement' },
    },
    {
      name: 'coachingBooking',
      type: 'relationship',
      relationTo: 'coaching-bookings',
      label: 'Réservation liée',
      admin: { readOnly: true, condition: (data) => data?.product === 'accompagnement' },
    },
    {
      type: 'collapsible',
      label: 'Détails techniques',
      admin: { initCollapsed: true },
      fields: [
        { name: 'editionId', type: 'text', label: 'Édition du livre (identifiant)', admin: { readOnly: true } },
        { name: 'providerId', type: 'text', label: 'Identifiant Stripe / PayPal de la commande', index: true, admin: { readOnly: true } },
        { name: 'paymentId', type: 'text', label: 'Identifiant du paiement', index: true, admin: { readOnly: true } },
        {
          name: 'secret',
          type: 'text',
          label: 'Clé privée (liens client)',
          required: true,
          unique: true,
          admin: { readOnly: true, hidden: true },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'downloadCount',
              type: 'number',
              label: 'Téléchargements utilisés',
              defaultValue: 0,
              admin: { description: 'Remettez à 0 si le client a besoin de nouveaux téléchargements.' },
            },
            {
              name: 'downloadExpiresAt',
              type: 'date',
              label: 'Lien valable jusqu’au',
              admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } },
            },
          ],
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: 'Statut',
      required: true,
      defaultValue: 'en-attente',
      options: ORDER_STATUSES,
      admin: { position: 'sidebar' },
    },
    { name: 'paidAt', type: 'date', label: 'Payée le', admin: { position: 'sidebar', readOnly: true } },
    {
      name: 'note',
      type: 'textarea',
      label: 'Note interne (non visible par le client)',
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    afterChange: [orderStatusMail],
  },
}
