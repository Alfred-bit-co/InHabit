import type { Video } from '@/payload-types'

export type YtVideo = {
  id: string
  title: string
  description?: string | null
  publishedAt?: string | null
  themes?: { id: number; name: string }[]
}

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))
  return m ? decode(m[1].trim()) : ''
}

const FEED_TTL = 60 * 60 * 1000 // 1 heure
const FEED_TIMEOUT = 2500 // YouTube lent ou injoignable : la page ne l'attend pas plus
const feedCache = new Map<string, { at: number; videos: YtVideo[] }>()

async function loadFeed(channelId: string): Promise<YtVideo[] | null> {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(FEED_TIMEOUT),
    })
    if (!res.ok) return null
    const xml = await res.text()
    return (
      xml
        .split('<entry>')
        .slice(1)
        .map((e) => ({
          id: tag(e, 'yt:videoId'),
          title: tag(e, 'title'),
          description: tag(e, 'media:description').slice(0, 220),
          publishedAt: tag(e, 'published'),
        }))
        // Exclut les Shorts du flux principal
        .filter((v) => v.id && !/#shorts/i.test(v.title))
    )
  } catch {
    return null
  }
}

/**
 * Dernières vidéos publiées sur la chaîne, via le flux RSS public de YouTube
 * (aucune clé d'API nécessaire).
 * Gardées en mémoire 1 heure : les pages du site sont rendues à chaque visite
 * (force-dynamic), ce qui désactive le cache de fetch de Next.js. Sans cela,
 * chaque visite de l'accueil retéléchargeait le flux YouTube.
 */
export async function fetchChannelVideos(channelId?: string | null, limit = 6): Promise<YtVideo[]> {
  if (!channelId || !/^UC[\w-]{22}$/.test(channelId)) return []
  const hit = feedCache.get(channelId)
  if (hit && Date.now() - hit.at < FEED_TTL) return hit.videos.slice(0, limit)
  const videos = await loadFeed(channelId)
  // En cas d'échec, on garde l'ancienne liste plutôt que rien
  if (videos) feedCache.set(channelId, { at: Date.now(), videos })
  return (videos ?? hit?.videos ?? []).slice(0, limit)
}

export const fromCollection = (v: Video): YtVideo => ({
  id: v.youtubeId || '',
  title: v.title,
  description: v.description,
  publishedAt: v.publishedAt,
  themes: (v.theme ?? [])
    .filter((t): t is Exclude<typeof t, number> => typeof t === 'object')
    .map((t) => ({ id: t.id, name: t.name })),
})

export const ytThumb = (id: string, quality: 'hq' | 'maxres' = 'hq') =>
  `https://i.ytimg.com/vi/${id}/${quality === 'maxres' ? 'maxresdefault' : 'hqdefault'}.jpg`
