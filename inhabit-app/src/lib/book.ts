import { cache } from 'react'
import type { Member } from '@/payload-types'
import { hasBookAccess } from './bookAccess'
import { getPayloadClient } from './payload'

export type ChapterItem = {
  id: number
  number: number
  title: string
  part?: string | null
  readable: boolean
}

/**
 * Sommaire du livre (titres uniquement, jamais le texte) avec, pour chaque chapitre,
 * l'indication « lisible par ce membre » (abonné uniquement).
 */
export const getChapterList = cache(async (member: Pick<Member, 'bookAccess' | 'bookAccessUntil'> | null): Promise<ChapterItem[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'book-chapters',
    where: { published: { equals: true } },
    sort: 'number',
    limit: 500,
    pagination: false,
    depth: 0,
    select: { number: true, title: true, part: true },
  })
  const full = hasBookAccess(member)
  return docs.map((c) => ({
    id: c.id,
    number: c.number,
    title: c.title,
    part: c.part,
    readable: full,
  }))
})

export const relId = (v: number | { id: number } | null | undefined) => (v && typeof v === 'object' ? v.id : (v ?? null))
