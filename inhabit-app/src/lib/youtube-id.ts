/** Extrait l'identifiant d'une vidéo à partir d'un lien YouTube (ou d'un ID brut). */
export function parseYoutubeId(input: string): string | null {
  const value = input.trim()
  if (/^[\w-]{11}$/.test(value)) return value
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\.|^m\./, '')
    if (host === 'youtu.be') return url.pathname.slice(1, 12) || null
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const v = url.searchParams.get('v')
      if (v) return v.slice(0, 11)
      const m = url.pathname.match(/\/(embed|shorts|live|v)\/([\w-]{11})/)
      if (m) return m[2]
    }
  } catch {
    /* pas une URL */
  }
  return null
}
