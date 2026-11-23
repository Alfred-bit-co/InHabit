import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import { adminOnly } from '../access'
import { getAdminEmail, safeSend } from '../hooks/notify'
import { emailTable, escapeHtml } from '../lib/escape'
import { CURRENCIES, formatMoney } from '../lib/payments/money'

export const ORDER_STATUS = [
  { label: 'En attente de paiement', value: 'en-attente' },
  { label: 'Payée', value: 'payee' },
  { label: 'Échouée', value: 'echouee' },
  { label: 'Expirée / abandonnée', value: 'expiree' },
  { label: 'Remboursée', value: 'remboursee' },
] as const

export const ORDER_PRODUCTS = [
  { label: 'Livre CONCEPT', value: 'livre' },
  { label: 'Accompagnement CONCEPT', value: 'accompagnement' },
] as const

const signature = '<p style="font-family:Arial,sans-serif;color:#888">— InHabit_Archi</p>'

/** Quand une commande passe en « Payée » : reçu au client + notification à l'administrateur. */
const paidMail: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (doc.status !== 'payee' || previousDoc?.status === 'payee') return doc
  const total = formatMoney(doc.amount, doc.currency)
  const site = (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/$/, '')
  const readLine = doc.grantsBookAccess
    ? `<p style="font-family:Arial,sans-serif">La lecture en ligne est ouverte dans votre espace membre : <a href="${site}/espace-membre">${site}/espace-membre</a> (connectez-vous avec votre compte).</p>`
    : ''
  await safeSend(req, {
    to: doc.email,
    subject: `Votre paiement est confirmé — ${doc.label}`,
    html: `<p style="font-family:Arial,sans-serif">Bonjour${doc.customerName ? ` ${escapeHtml(doc.customerName)}` : ''},</p><p style="font-family:Arial,sans-serif">Merci ! Votre paiement de <strong>${escapeHtml(total)}</strong> pour <strong>${escapeHtml(doc.label)}</strong> est bien reçu (référence ${escapeHtml(doc.reference)}).</p>${readLine}${signature}`,
  })
  await safeSend(req, {
    to: await getAdminEmail(req),
    subject: `[InHabit] Nouveau paiement — ${doc.label}`,
    html: emailTable([
      ['Référence', doc.reference],
      ['Produit', doc.label],
      ['Montant', total],
      ['Client', doc.customerName],
      ['Email', doc.email],
      ['Livraison', doc.shippingAddress],
    ]),
  })
  return doc
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Commande', plural: 'Commandes' },
  defaultSort: '-createdAt',
  admin: {
    group: 'Ventes & membres',
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'label', 'amount', 'status', 'email', 'createdAt'],
    hideAPIURL: true,
    components: {
      Description: {
        path: '/components/admin/Description#Description',
        clientProps: {
          text: 'Les paiements par carte faits sur le site. Le statut « Payée » est posé automatiquement par le prestataire de paiement : inutile de le modifier à la main.',
        },
      },
    },
  },
  access: adminOnly,
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'reference', type: 'text', label: 'Référence', required: true, unique: true, index: true, admin: { readOnly: true } },
        {
          name: 'status',
          type: 'select',
          label: 'Statut',
          required: true,
          defaultValue: 'en-attente',
          options: [...ORDER_STATUS],
          index: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'product', type: 'select', label: 'Produit', required: true, options: [...ORDER_PRODUCTS] },
        { name: 'label', type: 'text', label: 'Libellé', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'amount', type: 'number', label: 'Montant', required: true, min: 0, admin: { readOnly: true } },
        { name: 'currency', type: 'select', label: 'Devise', required: true, defaultValue: 'eur', options: [...CURRENCIES], admin: { readOnly: true } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email', label: 'Email du client', index: true },
        { name: 'customerName', type: 'text', label: 'Nom du client' },
      ],
    },
    { name: 'shippingAddress', type: 'textarea', label: 'Adresse de livraison (livre papier)' },
    {
      name: 'grantsBookAccess',
      type: 'checkbox',
      label: 'Donne accès à la lecture en ligne',
      defaultValue: false,
      admin: { readOnly: true },
    },
    {
      name: 'accessDays',
      type: 'number',
      label: 'Durée de l’accès (jours, vide = à vie)',
      admin: { readOnly: true, condition: (data) => Boolean(data?.grantsBookAccess) },
    },
    { name: 'editionId', type: 'text', admin: { hidden: true } },
    {
      name: 'member',
      type: 'relationship',
      relationTo: 'members',
      label: 'Compte membre',
      admin: { position: 'sidebar' },
    },
    {
      name: 'coachingBooking',
      type: 'relationship',
      relationTo: 'coaching-bookings',
      label: 'Réservation d’accompagnement',
      admin: { position: 'sidebar' },
    },
    {
      type: 'collapsible',
      label: 'Détails techniques du paiement',
      admin: { initCollapsed: true, position: 'sidebar' },
      fields: [
        { name: 'provider', type: 'text', label: 'Prestataire', defaultValue: 'stripe', admin: { readOnly: true } },
        { name: 'providerSessionId', type: 'text', label: 'Session de paiement', index: true, admin: { readOnly: true } },
        { name: 'providerPaymentId', type: 'text', label: 'Identifiant du paiement', admin: { readOnly: true } },
        { name: 'paidAt', type: 'date', label: 'Payée le', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    {
      name: 'note',
      type: 'textarea',
      label: 'Note interne',
      admin: { position: 'sidebar' },
    },
  ],
  hooks: { afterChange: [paidMail] },
}
