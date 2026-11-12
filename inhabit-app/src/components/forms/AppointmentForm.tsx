'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitAppointment } from '@/app/(frontend)/actions'
import type { DayAvailability } from '@/lib/availability'
import { fromISODate } from '@/lib/dates'
import { Field, Honeypot, Status, Submit, useFormAction } from './FormParts'

const dayLabel = (iso: string) => {
  const d = fromISODate(iso)
  return {
    weekday: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
    day: d.getDate(),
    month: d.toLocaleDateString('fr-FR', { month: 'short' }),
  }
}

export function AppointmentForm({ days, timezone }: { days: DayAvailability[]; timezone?: string | null }) {
  const { state, pending, ref, onSubmit } = useFormAction(submitAppointment)
  const [date, setDate] = useState<string>('')
  const [slot, setSlot] = useState<string>('')
  const router = useRouter()

  const slots = useMemo(() => days.find((d) => d.date === date)?.slots ?? [], [days, date])

  useEffect(() => {
    if (state.ok) {
      setDate('')
      setSlot('')
    }
    // Créneau pris entre-temps : recharge les disponibilités
    if (state.errors?.slot) router.refresh()
  }, [state, router])

  if (!days.length) {
    return (
      <>
        <Status state={state} />
        <p className="empty">Aucun créneau n’est disponible pour le moment. Revenez bientôt.</p>
      </>
    )
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className="form" noValidate>
      <Honeypot />
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend>1. Choisissez une date</legend>
        <div className="calendar" style={{ marginTop: 8 }}>
          {days.map((d) => {
            const l = dayLabel(d.date)
            return (
              <label key={d.date} className="choice">
                <input
                  type="radio"
                  name="date"
                  value={d.date}
                  checked={date === d.date}
                  onChange={() => {
                    setDate(d.date)
                    setSlot('')
                  }}
                />
                <span>
                  <small>{l.weekday}</small>
                  <strong>{l.day}</strong>
                  <small>{l.month}</small>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset
        className="field"
        style={{ border: 0, padding: 0, margin: 0 }}
        data-invalid={state.errors?.slot ? 'true' : undefined}
      >
        <legend>2. Choisissez un créneau {timezone ? `(${timezone})` : ''}</legend>
        {date ? (
          <div className="choices slots" style={{ marginTop: 8 }}>
            {slots.map((t) => (
              <label key={t} className="choice">
                <input type="radio" name="slot" value={t} checked={slot === t} onChange={() => setSlot(t)} />
                <span>{t}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="form-note">Sélectionnez d’abord une date.</p>
        )}
        {state.errors?.slot && (
          <span className="error" role="alert">
            {state.errors.slot}
          </span>
        )}
      </fieldset>

      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend>3. Présentez votre projet</legend>
      </fieldset>
      <div className="form-row">
        <Field name="name" label="Nom complet *" state={state}>
          <input id="name" name="name" required autoComplete="name" />
        </Field>
        <Field name="email" label="Email *" state={state}>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </Field>
      </div>
      <div className="form-row">
        <Field name="phone" label="Téléphone / WhatsApp" state={state}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" />
        </Field>
        <Field name="mode" label="Format de l’échange" state={state}>
          <select id="mode" name="mode" defaultValue="visio">
            <option value="visio">Visioconférence</option>
            <option value="telephone">Appel téléphonique</option>
          </select>
        </Field>
      </div>
      <div className="form-row">
        <Field name="projectType" label="Type de projet" state={state}>
          <select id="projectType" name="projectType" defaultValue="">
            <option value="">— Choisir —</option>
            <option value="maison">Maison individuelle</option>
            <option value="logements">Immeuble / logements</option>
            <option value="equipement">Équipement / commerce</option>
            <option value="renovation">Rénovation / extension</option>
            <option value="autre">Autre</option>
          </select>
        </Field>
        <Field name="location" label="Localisation du projet" state={state}>
          <input id="location" name="location" placeholder="Ville, pays" />
        </Field>
      </div>
      <Field name="description" label="Votre projet en quelques lignes *" state={state}>
        <textarea
          id="description"
          name="description"
          rows={5}
          required
          placeholder="Terrain, programme, budget envisagé, calendrier…"
        />
      </Field>
      <Status state={state} />
      <Submit pending={pending}>Confirmer le rendez-vous</Submit>
    </form>
  )
}
