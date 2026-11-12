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

/**
 * Dernières vidéos publiées sur la chaîne, via le flux RSS public de YouTube
 * (aucune clé d'API nécessaire). Mis en cache 1 heure.
 */
export async function fetchChannelVideos(channelId?: string | null, limit = 6): Promise<YtVideo[]> {
  if (!channelId || !/^UC[\w-]{22}$/.test(channelId)) return []
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const entries = xml.split('<entry>').slice(1)
    return entries
      .map((e) => ({
        id: tag(e, 'yt:videoId'),
        title: tag(e, 'title'),
        description: tag(e, 'media:description').slice(0, 220),
        publishedAt: tag(e, 'published'),
      }))
      // Exclut les Shorts du flux principal
      .filter((v) => v.id && !/#shorts/i.test(v.title))
      .slice(0, limit)
  } catch {
    return []
  }
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
