import type { Book } from '@/payload-types'
import { isCurrency } from './money'

export type BookEdition = NonNullable<Book['editions']>[number]

/** L'édition peut-elle être payée par carte sur le site (réglée dans l'admin) ? */
export const isCardPayable = (ed: BookEdition) =>
  ed.available !== false && Boolean(ed.payByCard && ed.priceAmount && ed.priceAmount > 0 && ed.id && isCurrency(ed.currency))

/** Page de commande d'une édition : récapitulatif, compte, puis paiement par carte. */
export const checkoutPath = (editionId: string) => `/paiement/livre?${new URLSearchParams({ edition: editionId })}`
