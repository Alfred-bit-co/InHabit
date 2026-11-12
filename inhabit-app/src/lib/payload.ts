import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'
import type { Media } from '@/payload-types'

export const getPayloadClient = cache(() => getPayload({ config }))

export const getSettings = cache(async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', depth: 0 })
})

type MaybeMedia = number | Media | null | undefined

/** URL d'une image Payload, avec une taille optimisée si elle existe. */
export function mediaUrl(media: MaybeMedia, size?: 'thumb' | 'card' | 'large'): string | null {
  if (!media || typeof media === 'number') return null
  const sized = size ? media.sizes?.[size]?.url : null
  return sized || media.url || null
}

export const mediaAlt = (media: MaybeMedia, fallback = '') =>
  media && typeof media === 'object' ? media.alt || fallback : fallback

export const isMedia = (m: MaybeMedia): m is Media => Boolean(m && typeof m === 'object')
