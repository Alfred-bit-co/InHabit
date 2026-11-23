const MESSAGES: Record<string, { ok: boolean; text: string }> = {
  annule: { ok: false, text: 'Paiement annulé : rien n’a été débité. Vous pouvez réessayer quand vous voulez.' },
  erreur: { ok: false, text: 'Le paiement n’a pas pu démarrer. Réessayez dans un instant ou écrivez-nous.' },
  indisponible: { ok: false, text: 'Le paiement par carte n’est pas disponible pour le moment.' },
}

/** Message affiché au retour de la page de paiement (?paiement=annule…). */
export function PayNotice({ status }: { status?: string }) {
  const msg = status ? MESSAGES[status] : undefined
  if (!msg) return null
  return (
    <p className={`form-status ${msg.ok ? 'ok' : 'ko'}`} role="status" style={{ margin: '0 0 20px' }}>
      {msg.text}
    </p>
  )
}
