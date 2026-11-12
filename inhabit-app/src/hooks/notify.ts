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
 * À la création d'une demande : prévient l'administrateur et,
 * si `confirmation` est fourni, envoie un accusé de réception au visiteur.
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
    await safeSend(req, { to: adminEmail, subject: `[InHabit] ${label}`, html: summary(doc) })
    const mail = confirmation?.(doc)
    if (mail) await safeSend(req, mail)
    return doc
  }
