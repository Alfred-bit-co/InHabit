import type { Metadata } from 'next'
import Link from 'next/link'
import { SideNav } from '@/components/member/SideNav'
import { firstName, requireMember } from '@/lib/member'

export const metadata: Metadata = { title: 'Espace membre', robots: { index: false } }

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const member = await requireMember()
  const name = member.name || firstName(member)

  return (
    <section className="member-section">
      <div className="container">
        <div className="member-shell">
          <aside className="member-side">
            <div className="member-hello">
              <span className="member-avatar" aria-hidden="true">
                {initials(name) || '·'}
              </span>
              <div>
                <span className="member-hello-small">Bon retour</span>
                <strong>{firstName(member)}</strong>
              </div>
            </div>
            <SideNav bookmarks={member.bookmarks?.length ?? 0} />
            <Link href="/" className="member-brand" aria-label="Retour au site InHabit">
              <small>Une plateforme</small>
              <span className="logo">
                <span className="logo-in">In</span>
                <span>Habit</span>
              </span>
            </Link>
          </aside>
          <div className="member-main">{children}</div>
        </div>
      </div>
    </section>
  )
}
