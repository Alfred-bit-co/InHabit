import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import { adminOnly } from '../access'
import { notifyOnCreate, safeSend } from '../hooks/notify'
import { emailTable, escapeHtml } from '../lib/escape'
import { formatDateFr, formatMonthFr } from '../lib/dates'
import { CONTACT_REASONS } from '../lib/constants'

const GROUP = 'Demandes reçues'

const statusField = (options: { label: string; value: string }[], defaultValue: string) => ({
  name: 'status',
  type: 'select' as const,
  label: 'Statut',
  required: true,
  defaultValue,
  options,
  admin: { position: 'sidebar' as const },
})

const internalNote = {
  name: 'note',
  type: 'textarea' as const,
  label: 'Note interne (non visible par le visiteur)',
  admin: { position: 'sidebar' as const },
}

const signature = '<p style="font-family:Arial,sans-serif;color:#888">— InHabit_Archi</p>'

/* ───────────── Accompagnement CONCEPT ───────────── */

const coachingStatusMail: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update' || doc.status === previousDoc?.status) return doc
  const month = formatMonthFr(doc.month)
  if (doc.status === 'confirmee') {
    await safeSend(req, {
      to: doc.email,
      subject: 'Votre place pour l’Accompagnement CONCEPT est confirmée',
      html: `<p style="font-family:Arial,sans-serif">Bonjour ${escapeHtml(doc.name)},</p><p style="font-family:Arial,sans-serif">Votre participation à l’Accompagnement CONCEPT pour <strong>${escapeHtml(month)}</strong> est confirmée. Vous recevrez prochainement les informations pratiques.</p>${signature}`,
    })
  }
  if (doc.status === 'annulee') {
    await safeSend(req, {
      to: doc.email,
      subject: 'Accompagnement CONCEPT : votre demande',
      html: `<p style="font-family:Arial,sans-serif">Bonjour ${escapeHtml(doc.name)},</p><p style="font-family:Arial,sans-serif">Votre demande pour <strong>${escapeHtml(month)}</strong> n’a pas pu être retenue. N’hésitez pas à choisir un autre mois sur le site.</p>${signature}`,
    })
  }
  return doc
}

export const CoachingBookings: CollectionConfig = {
  slug: 'coaching-bookings',
  labels: { singular: 'Réservation accompagnement', plural: 'Réservations accompagnement' },
  defaultSort: '-createdAt',
  admin: {
    group: GROUP,
    useAsTitle: 'name',
    defaultColumns: ['name', 'month', 'status', 'email', 'createdAt'],
    description:
      'Passez une réservation en « Confirmée » pour envoyer automatiquement un email de confirmation au participant.',
  },
  access: adminOnly,
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Nom complet', required: true },
        { name: 'email', type: 'email', label: 'Email', required: true },
        { name: 'phone', type: 'text', label: 'Téléphone / WhatsApp' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'month',
          type: 'text',
          label: 'Mois choisi (AAAA-MM)',
          required: true,
          index: true,
        },
        { name: 'country', type: 'text', label: 'Pays de résidence' },
        {
          name: 'profile',
          type: 'select',
          label: 'Profil',
          options: [
            { label: 'Étudiant·e', value: 'etudiant' },
            { label: 'Jeune diplômé·e', value: 'jeune-diplome' },
            { label: 'Architecte / professionnel·le', value: 'professionnel' },
            { label: 'Autre', value: 'autre' },
          ],
        },
      ],
    },
    { name: 'motivation', type: 'textarea', label: 'Objectifs et motivation' },
    statusField(
      [
        { label: 'Nouvelle (à traiter)', value: 'nouvelle' },
        { label: 'Confirmée', value: 'confirmee' },
        { label: 'Annulée', value: 'annulee' },
      ],
      'nouvelle',
    ),
    internalNote,
  ],
  hooks: {
    afterChange: [
      notifyOnCreate(
        'Nouvelle réservation — Accompagnement CONCEPT',
        (d) =>
          emailTable([
            ['Nom', d.name],
            ['Email', d.email],
            ['Téléphone', d.phone],
            ['Mois', formatMonthFr(d.month)],
            ['Pays', d.country],
            ['Profil', d.profile],
            ['Motivation', d.motivation],
          ]),
        (d) => ({
          to: d.email,
          subject: 'Nous avons bien reçu votre demande — Accompagnement CONCEPT',
          html: `<p style="font-family:Arial,sans-serif">Bonjour ${escapeHtml(d.name)},</p><p style="font-family:Arial,sans-serif">Merci pour votre demande de participation à l’Accompagnement CONCEPT (${escapeHtml(formatMonthFr(d.month))}). Elle sera étudiée rapidement et vous recevrez un email de confirmation.</p>${signature}`,
        }),
      ),
      coachingStatusMail,
    ],
  },
}

/* ───────────── Rendez-vous architectural ───────────── */

const appointmentCancelMail: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update' || doc.status === previousDoc?.status || doc.status !== 'annule') return doc
  await safeSend(req, {
    to: doc.email,
    subject: 'Votre rendez-vous architectural a été annulé',
    html: `<p style="font-family:Arial,sans-serif">Bonjour ${escapeHtml(doc.name)},</p><p style="font-family:Arial,sans-serif">Le rendez-vous du <strong>${escapeHtml(formatDateFr(doc.date))} à ${escapeHtml(doc.slot)}</strong> a dû être annulé. Vous pouvez choisir un nouveau créneau sur le site.</p>${signature}`,
  })
  return doc
}

export const Appointments: CollectionConfig = {
  slug: 'appointments',
  labels: { singular: 'Rendez-vous', plural: 'Rendez-vous' },
  defaultSort: 'date',
  admin: {
    group: GROUP,
    useAsTitle: 'name',
    defaultColumns: ['name', 'date', 'slot', 'status', 'email'],
    description:
      'Les créneaux réservés disparaissent automatiquement du site. Passez un rendez-vous en « Annulé » pour libérer le créneau et prévenir le visiteur.',
  },
  access: adminOnly,
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Nom complet', required: true },
        { name: 'email', type: 'email', label: 'Email', required: true },
        { name: 'phone', type: 'text', label: 'Téléphone / WhatsApp' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'date', type: 'text', label: 'Date (AAAA-MM-JJ)', required: true, index: true },
        { name: 'slot', type: 'text', label: 'Heure', required: true },
        {
          name: 'mode',
          type: 'select',
          label: 'Format',
          defaultValue: 'visio',
          options: [
            { label: 'Visioconférence', value: 'visio' },
            { label: 'Appel téléphonique', value: 'telephone' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'projectType',
          type: 'select',
          label: 'Type de projet',
          options: [
            { label: 'Maison individuelle', value: 'maison' },
            { label: 'Immeuble / logements', value: 'logements' },
            { label: 'Équipement / commerce', value: 'equipement' },
            { label: 'Rénovation / extension', value: 'renovation' },
            { label: 'Autre', value: 'autre' },
          ],
        },
        { name: 'location', type: 'text', label: 'Localisation du projet' },
      ],
    },
    { name: 'description', type: 'textarea', label: 'Présentation du projet', required: true },
    statusField(
      [
        { label: 'Confirmé', value: 'confirme' },
        { label: 'Effectué', value: 'effectue' },
        { label: 'Annulé', value: 'annule' },
      ],
      'confirme',
    ),
    internalNote,
  ],
  hooks: {
    afterChange: [
      notifyOnCreate(
        'Nouveau rendez-vous architectural',
        (d) =>
          emailTable([
            ['Nom', d.name],
            ['Email', d.email],
            ['Téléphone', d.phone],
            ['Date', `${formatDateFr(d.date)} à ${d.slot}`],
            ['Format', d.mode],
            ['Type de projet', d.projectType],
            ['Localisation', d.location],
            ['Projet', d.description],
          ]),
        (d) => ({
          to: d.email,
          subject: 'Votre rendez-vous architectural est confirmé',
          html: `<p style="font-family:Arial,sans-serif">Bonjour ${escapeHtml(d.name)},</p><p style="font-family:Arial,sans-serif">Votre rendez-vous gratuit est confirmé pour le <strong>${escapeHtml(formatDateFr(d.date))} à ${escapeHtml(d.slot)}</strong> (heure indiquée sur le site). Le lien ou l’appel vous sera communiqué avant l’échange.</p>${signature}`,
        }),
      ),
      appointmentCancelMail,
    ],
  },
}

/* ───────────── Contact & partenariats ───────────── */

export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  labels: { singular: 'Message de contact', plural: 'Messages de contact' },
  defaultSort: '-createdAt',
  admin: {
    group: GROUP,
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'name', 'reason', 'status', 'createdAt'],
  },
  access: adminOnly,
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Nom', required: true },
        { name: 'email', type: 'email', label: 'Email', required: true },
        { name: 'organization', type: 'text', label: 'Organisation' },
      ],
    },
    { name: 'reason', type: 'select', label: 'Motif', required: true, options: CONTACT_REASONS },
    { name: 'subject', type: 'text', label: 'Objet', required: true },
    { name: 'message', type: 'textarea', label: 'Message', required: true },
    statusField(
      [
        { label: 'Nouveau', value: 'nouveau' },
        { label: 'En cours', value: 'en-cours' },
        { label: 'Traité', value: 'traite' },
      ],
      'nouveau',
    ),
    internalNote,
  ],
  hooks: {
    afterChange: [
      notifyOnCreate('Nouveau message de contact', (d) =>
        emailTable([
          ['Motif', CONTACT_REASONS.find((r) => r.value === d.reason)?.label],
          ['Nom', d.name],
          ['Email', d.email],
          ['Organisation', d.organization],
          ['Objet', d.subject],
          ['Message', d.message],
        ]),
      ),
    ],
  },
}

/* ───────────── Suggestions de sujets YouTube ───────────── */

export const TopicSuggestions: CollectionConfig = {
  slug: 'topic-suggestions',
  labels: { singular: 'Suggestion de sujet', plural: 'Suggestions de sujets' },
  defaultSort: '-createdAt',
  admin: {
    group: GROUP,
    useAsTitle: 'topic',
    defaultColumns: ['topic', 'name', 'status', 'createdAt'],
  },
  access: adminOnly,
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Nom ou pseudo' },
        { name: 'email', type: 'email', label: 'Email' },
      ],
    },
    { name: 'topic', type: 'text', label: 'Sujet proposé', required: true },
    { name: 'details', type: 'textarea', label: 'Détails' },
    statusField(
      [
        { label: 'Nouvelle', value: 'nouveau' },
        { label: 'Retenue', value: 'retenu' },
        { label: 'Traitée en vidéo', value: 'traite' },
        { label: 'Écartée', value: 'ecarte' },
      ],
      'nouveau',
    ),
    internalNote,
  ],
  hooks: {
    afterChange: [
      notifyOnCreate('Nouvelle suggestion de sujet YouTube', (d) =>
        emailTable([
          ['Sujet', d.topic],
          ['Détails', d.details],
          ['Nom', d.name],
          ['Email', d.email],
        ]),
      ),
    ],
  },
}
