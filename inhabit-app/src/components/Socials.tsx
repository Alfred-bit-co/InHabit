import type { SiteSetting } from '@/payload-types'

const LABELS: Record<string, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  x: 'X',
  whatsapp: 'WhatsApp',
}

export function Socials({ settings, style }: { settings: SiteSetting; style?: React.CSSProperties }) {
  const items = settings.socials ?? []
  if (!items.length) return null
  return (
    <div className="socials" style={{ marginTop: 20, ...style }}>
      {items.map((s) => (
        <a key={s.id ?? s.url} href={s.url} target="_blank" rel="noopener noreferrer">
          {LABELS[s.platform] ?? s.platform}
        </a>
      ))}
    </div>
  )
}
