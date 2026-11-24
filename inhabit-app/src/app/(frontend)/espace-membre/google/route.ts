import { NextResponse } from 'next/server'
import { encodeFlow, GOOGLE_COOKIE, googleEnabled, startGoogleFlow } from '@/lib/google'
import { safeNext } from '@/lib/member'
import { siteUrl } from '@/lib/payments/provider'

export const dynamic = 'force-dynamic'

/** « Continuer avec Google » : part vers la page de choix du compte Google. */
export async function GET(request: Request) {
  const next = safeNext(new URL(request.url).searchParams.get('suite'))
  if (!googleEnabled()) {
    return NextResponse.redirect(`${siteUrl()}/espace-membre/connexion?erreur=google-indisponible`)
  }
  const { flow, url } = startGoogleFlow(next)
  const res = NextResponse.redirect(url)
  res.cookies.set(GOOGLE_COOKIE, encodeFlow(flow), {
    httpOnly: true,
    sameSite: 'lax',
    secure: siteUrl().startsWith('https://'),
    path: '/espace-membre/google',
    maxAge: 10 * 60,
  })
  res.headers.set('Cache-Control', 'no-store')
  return res
}
