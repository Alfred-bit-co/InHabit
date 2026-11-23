import Link from 'next/link'
import { IconBag } from '@/components/member/icons'
import { formatShortDate } from '@/lib/dates'
import { requireSubscriber } from '@/lib/member'
import { getPayloadClient } from '@/lib/payload'
import { formatMoney } from '@/lib/payments/money'

const STATUS: Record<string, { label: string; cls: string }> = {
  payee: { label: 'Payée', cls: 'ok' },
  'en-attente': { label: 'En attente', cls: 'wait' },
  echouee: { label: 'Échouée', cls: 'ko' },
  expiree: { label: 'Abandonnée', cls: 'ko' },
  remboursee: { label: 'Remboursée', cls: 'wait' },
}

/** Les paiements jamais finalisés de plus d'un jour ne sont pas utiles au client. */
const pendingSince = () => new Date(Date.now() - 86_400_000).toISOString()

export default async function PurchasesPage() {
  const member = await requireSubscriber('/espace-membre/achats')
  const payload = await getPayloadClient()
  // Uniquement les commandes passées avec ce compte
  const { docs: orders } = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { member: { equals: member.id } },
        {
          or: [
            { status: { in: ['payee', 'remboursee'] } },
            { and: [{ status: { equals: 'en-attente' } }, { createdAt: { greater_than: pendingSince() } }] },
          ],
        },
      ],
    },
    sort: '-createdAt',
    limit: 50,
    depth: 0,
  })
  const visible = orders

  return (
    <div className="member-page">
      <header className="member-head">
        <div>
          <span className="eyebrow">Mes achats</span>
          <h1>Vos commandes et reçus.</h1>
        </div>
      </header>

      {visible.length ? (
        <div className="member-card orders">
          <table>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Produit</th>
                <th scope="col">Montant</th>
                <th scope="col">Statut</th>
                <th scope="col">Référence</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => {
                const s = STATUS[o.status] ?? { label: o.status, cls: 'wait' }
                return (
                  <tr key={o.id}>
                    <td data-label="Date">{formatShortDate(o.paidAt || o.createdAt)}</td>
                    <td data-label="Produit">{o.label}</td>
                    <td data-label="Montant">{formatMoney(o.amount, o.currency)}</td>
                    <td data-label="Statut">
                      <span className={`order-status ${s.cls}`}>{s.label}</span>
                    </td>
                    <td data-label="Référence" className="muted">
                      {o.reference}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="member-card member-empty">
          <IconBag size={28} />
          <p>Vous n’avez encore rien acheté avec ce compte.</p>
          <Link href="/produits" className="btn btn-accent btn-sm">
            Voir les produits
          </Link>
        </div>
      )}
      <p className="form-note" style={{ marginTop: 16 }}>
        Une question sur une commande ? <Link href="/a-propos#contact">Écrivez-nous</Link> en indiquant sa référence.
      </p>
    </div>
  )
}
