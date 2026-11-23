import { PasswordForm, ProfileForm } from '@/components/member/AuthForms'
import { hasBookAccess } from '@/lib/bookAccess'
import { formatShortDate } from '@/lib/dates'
import { requireMember } from '@/lib/member'

export default async function ProfilePage() {
  const member = await requireMember('/espace-membre/profil')
  return (
    <div className="member-page">
      <header className="member-head">
        <div>
          <span className="eyebrow">Profil</span>
          <h1>Votre compte.</h1>
        </div>
        <span className="muted">Membre depuis le {formatShortDate(member.createdAt)}</span>
      </header>
      <section className="member-card">
        <h3>Informations</h3>
        <ProfileForm name={member.name ?? ''} email={member.email} />
      </section>
      <section className="member-card">
        <h3>Mot de passe</h3>
        <PasswordForm />
      </section>
      <section className="member-card">
        <h3>Accès</h3>
        <p className="muted" style={{ margin: 0 }}>
          {hasBookAccess(member)
            ? member.bookAccessUntil
              ? `Lecture complète du livre ouverte jusqu’au ${formatShortDate(member.bookAccessUntil)}.`
              : 'Lecture complète du livre CONCEPT ouverte à vie sur ce compte.'
            : member.bookAccess
              ? `Votre accès a pris fin le ${formatShortDate(member.bookAccessUntil)}. Un nouvel achat le rouvre.`
              : 'Vous avez accès aux extraits offerts. L’achat d’une édition numérique ouvre la lecture complète.'}
        </p>
      </section>
      <p className="form-note">
        Pour supprimer votre compte et vos données, écrivez-nous depuis la page contact.
      </p>
    </div>
  )
}
