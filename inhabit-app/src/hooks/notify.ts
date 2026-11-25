import { after } from 'next/server'
import type { CollectionAfterChangeHook, PayloadRequest } from 'payload'

type Mail = { to: string; subject: string; html: string }

/** Adresse qui reçoit les notifications (réglages du site, sinon variable d'env). */
export async function getAdminEmail(req: PayloadRequest) {
  try {
    const settings = await req.payload.findGlobal({ slug: 'site-settings', req, depth: 0 })
    return settings?.notificationEmail || process.env.ADMIN_EMAIL || ''
  } catch {
    return process.env.ADMIN_EMAIL || ''
  }
}

export async function safeSend(req: PayloadRequest, mail: Mail) {
  if (!mail.to) return
  try {
    await req.payload.sendEmail(mail)
  } catch (err) {
    req.payload.logger.error({ err, msg: `Échec d'envoi d'email à ${mail.to}` })
  }
}

/**
 * Lance une tâche APRÈS la réponse au visiteur (Vercel garde la fonction active
 * jusqu'à la fin de la tâche). Hors d'une requête (script de seed…), on attend simplement.
 */
export async function afterResponse(task: () => Promise<unknown>) {
  try {
    after(task)
  } catch {
    await task()
  }
}

/**
 * À la création d'une demande : prévient l'administrateur et,
 * si `confirmation` est fourni, envoie un accusé de réception au visiteur.
 * Les emails partent en parallèle et après la réponse : le visiteur n'attend
 * plus le serveur d'emails (plusieurs secondes) pour voir « Merci ».
 */
export const notifyOnCreate =
  (
    label: string,
    summary: (doc: any) => string,
    confirmation?: (doc: any) => Mail | null,
  ): CollectionAfterChangeHook =>
  async ({ doc, operation, req }) => {
    if (operation !== 'create') return doc
    const adminEmail = await getAdminEmail(req)
    const mails: Mail[] = [{ to: adminEmail, subject: `[InHabit] ${label}`, html: summary(doc) }]
    const mail = confirmation?.(doc)
    if (mail) mails.push(mail)
    await afterResponse(() => Promise.all(mails.map((m) => safeSend(req, m))))
    return doc
  }
