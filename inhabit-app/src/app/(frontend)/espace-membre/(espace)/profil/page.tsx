import { PasswordForm, ProfileForm } from '@/components/member/AuthForms'
import { formatShortDate } from '@/lib/dates'
import { requireSubscriber } from '@/lib/member'

export default async function ProfilePage() {
  const member = await requireSubscriber('/espace-membre/profil')
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
        {member.googleId && (
          <p className="form-note" style={{ marginTop: 0 }}>
            Vous vous connectez avec Google. Pour aussi pouvoir vous connecter par email, choisissez un mot de passe
            avec « Mot de passe oublié » sur la page de connexion.
          </p>
        )}
        <PasswordForm />
      </section>
      <section className="member-card">
        <h3>Accès</h3>
        <p className="muted" style={{ margin: 0 }}>
          {member.bookAccessUntil
            ? `Abonnement actif jusqu’au ${formatShortDate(member.bookAccessUntil)}. Un nouvel achat le prolonge.`
            : 'Accès à vie à l’espace membre et au livre CONCEPT sur ce compte.'}
        </p>
      </section>
      <p className="form-note">
        Pour supprimer votre compte et vos données, écrivez-nous depuis la page contact.
      </p>
    </div>
  )
}
