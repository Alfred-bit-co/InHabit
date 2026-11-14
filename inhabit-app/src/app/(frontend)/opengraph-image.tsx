import { ImageResponse } from 'next/og'

/**
 * Image d'aperçu par défaut quand une page du site est partagée (WhatsApp, LinkedIn, X…).
 * Les pages projet gardent leur propre image (la couverture du projet).
 */
export const alt = 'InHabit_Archi — Architecture begins as art.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Police du site (Urbanist) ; si Google Fonts ne répond pas, l'image est générée avec la police par défaut. */
async function urbanist(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Urbanist:wght@${weight}`)).text()
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    return url ? await (await fetch(url)).arrayBuffer() : null
  } catch {
    return null
  }
}

export default async function Image() {
  const [bold, medium] = await Promise.all([urbanist(700), urbanist(500)])
  const fonts = [
    ...(bold ? [{ name: 'Urbanist', data: bold, weight: 700 as const, style: 'normal' as const }] : []),
    ...(medium ? [{ name: 'Urbanist', data: medium, weight: 500 as const, style: 'normal' as const }] : []),
  ]
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #f3eee6 0%, #e7dccb 100%)',
          color: '#1f1a15',
          fontFamily: 'Urbanist',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 96,
              height: 96,
              borderRadius: 28,
              background: '#a45428',
              color: '#ffffff',
              fontSize: 50,
              fontWeight: 700,
            }}
          >
            In
          </div>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, letterSpacing: -2 }}>Habit</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', fontSize: 86, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>
            Architecture begins as
            <span style={{ color: '#a45428', marginLeft: 22 }}>art.</span>
          </div>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 500, color: '#7a6e60' }}>
            InHabit_Archi — architecture, livre CONCEPT et projets
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  )
}
