'use server'

import config from '@payload-config'
import { login, logout } from '@payloadcms/next/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { FormState } from '@/app/(frontend)/actions'
import { getMember, getSubscriber, safeNext } from '@/lib/member'
import { getPayloadClient } from '@/lib/payload'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const str = (fd: FormData, key: string, max = 300) => String(fd.get(key) ?? '').trim().slice(0, max)
const fail = (message: string, errors?: Record<string, string>): FormState => ({ ok: false, message, errors })

const PASSWORD_MIN = 8

/* ───────────── Connexion / inscription ───────────── */

export async function loginMember(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, 'email', 160).toLowerCase()
  const password = String(fd.get('password') ?? '')
  if (!EMAIL_RE.test(email) || !password) return fail('Indiquez votre email et votre mot de passe.')
  try {
    await login({ collection: 'members', config, email, password })
  } catch {
    // Message volontairement vague : ne révèle pas si le compte existe
    return fail('Email ou mot de passe incorrect. Après 5 essais, le compte est bloqué 10 minutes.')
  }
  redirect(safeNext(fd.get('suite')))
}

export async function registerMember(_: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, 'website')) return fail('Inscription impossible.')
  const name = str(fd, 'name', 120)
  const email = str(fd, 'email', 160).toLowerCase()
  const password = String(fd.get('password') ?? '')
  const errors: Record<string, string> = {}
  if (!name) errors.name = 'Indiquez votre nom.'
  if (!EMAIL_RE.test(email)) errors.email = 'Email invalide.'
  if (password.length < PASSWORD_MIN) errors.password = `Au moins ${PASSWORD_MIN} caractères.`
  if (!fd.get('consent')) errors.consent = 'Merci d’accepter la politique de confidentialité.'
  if (Object.keys(errors).length) return fail('Merci de vérifier les champs indiqués.', errors)

  const payload = await getPayloadClient()
  const existing = await payload.count({ collection: 'members', where: { email: { equals: email } } })
  if (existing.totalDocs) {
    return fail('Un compte existe déjà avec cet email. Connectez-vous ou choisissez « Mot de passe oublié ».', {
      email: 'Compte déjà existant.',
    })
  }
  try {
    // Seuls ces trois champs sont acceptés : l'accès au livre ne s'ouvre jamais ici
    await payload.create({ collection: 'members', data: { name, email, password } })
    await login({ collection: 'members', config, email, password })
  } catch (err) {
    console.error('[membre] inscription', err)
    return fail('Inscription impossible pour le moment. Réessayez dans un instant.')
  }
  redirect(safeNext(fd.get('suite')))
}

export async function logoutMember() {
  const member = await getMember()
  if (member) await logout({ config })
  redirect('/espace-membre/connexion')
}

/* ───────────── Mot de passe ───────────── */

export async function forgotPasswordMember(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, 'email', 160).toLowerCase()
  if (!EMAIL_RE.test(email)) return fail('Email invalide.', { email: 'Email invalide.' })
  try {
    const payload = await getPayloadClient()
    await payload.forgotPassword({ collection: 'members', data: { email } })
  } catch (err) {
    console.error('[membre] mot de passe oublié', err)
  }
  // Même réponse que le compte existe ou non
  return { ok: true, message: 'Si un compte existe avec cet email, un lien pour choisir un nouveau mot de passe vient d’être envoyé.' }
}

export async function resetPasswordMember(_: FormState, fd: FormData): Promise<FormState> {
  const token = str(fd, 'token', 200)
  const password = String(fd.get('password') ?? '')
  if (!token) return fail('Lien incomplet. Refaites une demande de nouveau mot de passe.')
  if (password.length < PASSWORD_MIN) return fail('Mot de passe trop court.', { password: `Au moins ${PASSWORD_MIN} caractères.` })
  try {
    const payload = await getPayloadClient()
    const result = await payload.resetPassword({ collection: 'members', data: { token, password }, overrideAccess: true })
    const email = (result.user as { email?: string } | undefined)?.email
    if (email) await login({ collection: 'members', config, email, password })
  } catch {
    return fail('Ce lien a expiré ou a déjà servi. Refaites une demande de nouveau mot de passe.')
  }
  redirect('/espace-membre')
}

/* ───────────── Profil ───────────── */

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const member = await getMember()
  if (!member) return fail('Session expirée, reconnectez-vous.')
  const name = str(fd, 'name', 120)
  if (!name) return fail('Indiquez votre nom.', { name: 'Indiquez votre nom.' })
  const payload = await getPayloadClient()
  await payload.update({ collection: 'members', id: member.id, data: { name }, depth: 0 })
  revalidatePath('/espace-membre', 'layout')
  return { ok: true, message: 'Profil mis à jour.' }
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const member = await getMember()
  if (!member) return fail('Session expirée, reconnectez-vous.')
  const current = String(fd.get('current') ?? '')
  const next = String(fd.get('password') ?? '')
  if (next.length < PASSWORD_MIN) return fail('Nouveau mot de passe trop court.', { password: `Au moins ${PASSWORD_MIN} caractères.` })
  const payload = await getPayloadClient()
  try {
    await payload.login({ collection: 'members', data: { email: member.email, password: current } })
  } catch {
    return fail('Mot de passe actuel incorrect.', { current: 'Mot de passe incorrect.' })
  }
  await payload.update({ collection: 'members', id: member.id, data: { password: next }, depth: 0 })
  // Le changement de mot de passe ferme la session : on reconnecte avec le nouveau
  await login({ collection: 'members', config, email: member.email, password: next })
  return { ok: true, message: 'Mot de passe modifié.' }
}

/* ───────────── Lecture ───────────── */

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0)

/** Le membre (abonné) peut-il lire ce chapitre ? (mêmes règles que la collection) */
async function readableChapter(chapterId: number) {
  const member = await getSubscriber()
  if (!member || !Number.isInteger(chapterId)) return null
  const payload = await getPayloadClient()
  const chapter = await payload.findByID({
    collection: 'book-chapters',
    id: chapterId,
    depth: 0,
    overrideAccess: false,
    user: member,
    disableErrors: true,
    select: { title: true },
  })
  return chapter ? { member, payload } : null
}

export async function saveReadingProgress(chapterId: number, position: number) {
  const ctx = await readableChapter(chapterId)
  if (!ctx) return
  await ctx.payload.update({
    collection: 'members',
    id: ctx.member.id,
    data: { readingChapter: chapterId, readingPosition: clamp01(position) },
    depth: 0,
  })
}

export async function addBookmark(chapterId: number, position: number, excerpt: string) {
  const ctx = await readableChapter(chapterId)
  if (!ctx) return { ok: false }
  const bookmarks = bookmarkData(ctx.member.bookmarks)
  if (bookmarks.length >= 200) return { ok: false }
  bookmarks.push({
    id: undefined,
    chapter: chapterId,
    position: clamp01(position),
    page: undefined,
    excerpt: String(excerpt || '').trim().slice(0, 160),
    createdAt: new Date().toISOString(),
  })
  await ctx.payload.update({ collection: 'members', id: ctx.member.id, data: { bookmarks }, depth: 0 })
  revalidatePath('/espace-membre', 'layout')
  return { ok: true }
}

export async function removeBookmark(fd: FormData) {
  const bookmarkId = String(fd.get('id') ?? '')
  const member = await getSubscriber()
  if (!member || !bookmarkId) return
  const payload = await getPayloadClient()
  const bookmarks = bookmarkData(member.bookmarks).filter((b) => b.id !== bookmarkId)
  await payload.update({ collection: 'members', id: member.id, data: { bookmarks }, depth: 0 })
  revalidatePath('/espace-membre', 'layout')
}

/* ───────────── Lecture du PDF protégé ───────────── */

const toPage = (n: number) => (Number.isInteger(n) && n >= 1 && n <= 100_000 ? n : null)

const bookmarkData = (list: NonNullable<Awaited<ReturnType<typeof getMember>>>['bookmarks']) =>
  (list ?? []).map((b) => ({
    id: b.id,
    chapter: b.chapter && typeof b.chapter === 'object' ? b.chapter.id : b.chapter,
    position: b.position,
    page: b.page,
    excerpt: b.excerpt,
    createdAt: b.createdAt,
  }))

export async function savePdfPage(page: number) {
  const member = await getSubscriber()
  const p = toPage(page)
  if (!member || !p) return
  const payload = await getPayloadClient()
  await payload.update({ collection: 'members', id: member.id, data: { pdfPage: p }, depth: 0 })
}

export async function addPdfBookmark(page: number) {
  const member = await getSubscriber()
  const p = toPage(page)
  if (!member || !p) return { ok: false }
  const bookmarks = bookmarkData(member.bookmarks)
  if (bookmarks.length >= 200) return { ok: false }
  if (bookmarks.some((b) => b.page === p)) return { ok: true }
  bookmarks.push({ id: undefined, chapter: undefined, position: undefined, page: p, excerpt: `Page ${p}`, createdAt: new Date().toISOString() })
  const payload = await getPayloadClient()
  await payload.update({ collection: 'members', id: member.id, data: { bookmarks }, depth: 0 })
  revalidatePath('/espace-membre', 'layout')
  return { ok: true }
}
