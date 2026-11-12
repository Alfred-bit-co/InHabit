'use server'

import { computeAvailability, computeMonths } from '@/lib/availability'
import { formatDateFr, formatMonthFr } from '@/lib/dates'
import { getPayloadClient } from '@/lib/payload'
import { CONTACT_REASONS } from '@/lib/constants'

export type FormState = {
  ok: boolean
  message: string
  errors?: Record<string, string>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const str = (fd: FormData, key: string, max = 2000) => String(fd.get(key) ?? '').trim().slice(0, max)

/** Champ caché anti-robots : un humain ne le remplit jamais. */
const isBot = (fd: FormData) => str(fd, 'website') !== ''

const fail = (errors: Record<string, string>): FormState => ({
  ok: false,
  message: 'Merci de vérifier les champs indiqués.',
  errors,
})

const serverError: FormState = {
  ok: false,
  message: 'Une erreur est survenue. Réessayez dans un instant ou écrivez-nous directement.',
}

/* ───────────── Contact ───────────── */

export async function submitContact(_: FormState, fd: FormData): Promise<FormState> {
  if (isBot(fd)) return { ok: true, message: 'Merci, votre message a bien été envoyé.' }
  const data = {
    name: str(fd, 'name', 120),
    email: str(fd, 'email', 160),
    organization: str(fd, 'organization', 160),
    reason: str(fd, 'reason', 40),
    subject: str(fd, 'subject', 200),
    message: str(fd, 'message', 5000),
  }
  const errors: Record<string, string> = {}
  if (!data.name) errors.name = 'Indiquez votre nom.'
  if (!EMAIL_RE.test(data.email)) errors.email = 'Email invalide.'
  if (!CONTACT_REASONS.some((r) => r.value === data.reason)) errors.reason = 'Choisissez un motif.'
  if (!data.subject) errors.subject = 'Indiquez un objet.'
  if (data.message.length < 10) errors.message = 'Votre message est trop court.'
  if (Object.keys(errors).length) return fail(errors)

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'contact-messages',
      data: { ...data, reason: data.reason as 'question', status: 'nouveau' },
    })
    return { ok: true, message: 'Merci, votre message a bien été envoyé. Nous vous répondrons rapidement.' }
  } catch (err) {
    console.error(err)
    return serverError
  }
}

/* ───────────── Suggestion de sujet ───────────── */

export async function submitSuggestion(_: FormState, fd: FormData): Promise<FormState> {
  if (isBot(fd)) return { ok: true, message: 'Merci pour votre suggestion !' }
  const data = {
    name: str(fd, 'name', 120),
    email: str(fd, 'email', 160),
    topic: str(fd, 'topic', 200),
    details: str(fd, 'details', 3000),
  }
  const errors: Record<string, string> = {}
  if (data.topic.length < 4) errors.topic = 'Décrivez le sujet en quelques mots.'
  if (data.email && !EMAIL_RE.test(data.email)) errors.email = 'Email invalide.'
  if (Object.keys(errors).length) return fail(errors)

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'topic-suggestions',
      data: { ...data, email: data.email || undefined, status: 'nouveau' },
    })
    return { ok: true, message: 'Merci pour votre suggestion ! Elle a bien été transmise.' }
  } catch (err) {
    console.error(err)
    return serverError
  }
}

/* ───────────── Accompagnement CONCEPT ───────────── */

export async function submitCoaching(_: FormState, fd: FormData): Promise<FormState> {
  if (isBot(fd)) return { ok: true, message: 'Demande envoyée.' }
  const data = {
    name: str(fd, 'name', 120),
    email: str(fd, 'email', 160),
    phone: str(fd, 'phone', 40),
    country: str(fd, 'country', 80),
    profile: str(fd, 'profile', 40),
    month: str(fd, 'month', 7),
    motivation: str(fd, 'motivation', 4000),
  }
  const errors: Record<string, string> = {}
  if (!data.name) errors.name = 'Indiquez votre nom.'
  if (!EMAIL_RE.test(data.email)) errors.email = 'Email invalide.'
  if (!data.month) errors.month = 'Choisissez un mois.'
  if (data.motivation.length < 20) errors.motivation = 'Présentez vos objectifs en quelques lignes.'
  if (Object.keys(errors).length) return fail(errors)

  try {
    const payload = await getPayloadClient()
    const [coaching, bookings] = await Promise.all([
      payload.findGlobal({ slug: 'coaching', depth: 0 }),
      payload.find({
        collection: 'coaching-bookings',
        where: { and: [{ month: { equals: data.month } }, { status: { not_equals: 'annulee' } }] },
        limit: 0,
        depth: 0,
      }),
    ])
    const month = computeMonths(coaching, { [data.month]: bookings.totalDocs }).find(
      (m) => m.month === data.month,
    )
    if (!month) return fail({ month: 'Ce mois n’est plus proposé.' })
    if (month.full) return fail({ month: `Il n’y a plus de place en ${formatMonthFr(data.month)}.` })

    await payload.create({
      collection: 'coaching-bookings',
      data: {
        ...data,
        profile: (data.profile || undefined) as 'autre' | undefined,
        status: 'nouvelle',
      },
    })
    return {
      ok: true,
      message: `Votre demande pour ${formatMonthFr(data.month)} est enregistrée. Vous recevrez un email de confirmation.`,
    }
  } catch (err) {
    console.error(err)
    return serverError
  }
}

/* ───────────── Rendez-vous architectural ───────────── */

export async function submitAppointment(_: FormState, fd: FormData): Promise<FormState> {
  if (isBot(fd)) return { ok: true, message: 'Rendez-vous enregistré.' }
  const data = {
    name: str(fd, 'name', 120),
    email: str(fd, 'email', 160),
    phone: str(fd, 'phone', 40),
    date: str(fd, 'date', 10),
    slot: str(fd, 'slot', 5),
    mode: str(fd, 'mode', 20) || 'visio',
    projectType: str(fd, 'projectType', 40),
    location: str(fd, 'location', 160),
    description: str(fd, 'description', 4000),
  }
  const errors: Record<string, string> = {}
  if (!data.name) errors.name = 'Indiquez votre nom.'
  if (!EMAIL_RE.test(data.email)) errors.email = 'Email invalide.'
  if (!data.date || !data.slot) errors.slot = 'Choisissez une date et un créneau.'
  if (data.description.length < 20) errors.description = 'Présentez votre projet en quelques lignes.'
  if (Object.keys(errors).length) return fail(errors)

  try {
    const payload = await getPayloadClient()
    const [settings, taken] = await Promise.all([
      payload.findGlobal({ slug: 'appointment-settings', depth: 0 }),
      payload.find({
        collection: 'appointments',
        where: { and: [{ date: { equals: data.date } }, { status: { not_equals: 'annule' } }] },
        limit: 0,
        depth: 0,
      }),
    ])
    const booked = new Set(taken.docs.map((a) => `${a.date} ${a.slot}`))
    const day = computeAvailability(settings, booked).find((d) => d.date === data.date)
    if (!day || !day.slots.includes(data.slot)) {
      return fail({ slot: 'Ce créneau vient d’être réservé. Merci d’en choisir un autre.' })
    }

    await payload.create({
      collection: 'appointments',
      data: {
        ...data,
        mode: data.mode as 'visio',
        projectType: (data.projectType || undefined) as 'autre' | undefined,
        status: 'confirme',
      },
    })
    return {
      ok: true,
      message: `Votre rendez-vous est confirmé pour le ${formatDateFr(data.date)} à ${data.slot}. Un email récapitulatif vous a été envoyé.`,
    }
  } catch (err) {
    console.error(err)
    return serverError
  }
}
