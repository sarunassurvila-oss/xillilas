'use client'

import { useActionState, useState } from 'react'
import { saveProfile, type ProfileState } from '@/app/mano/actions'
import { LogoUpload } from '@/components/LogoUpload'

type Props = { uid: string; fullName: string; phone: string; sellerKind: 'private' | 'agency'; logoPath: string | null }

export function ProfileForm({ uid, fullName, phone, sellerKind, logoPath }: Props) {
  const [kind, setKind] = useState(sellerKind)
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, { ok: false, message: '', errors: {} })
  const e = state.errors
  return (
    <form action={action} className="form-section" noValidate>
      <h2>Kontaktai</h2>
      <p className="hint">Šie duomenys automatiškai įrašomi į naujus skelbimus. Kiekviename skelbime juos galite pakeisti.</p>
      <div className="seg" role="radiogroup" aria-label="Skelbėjo tipas">
        <label><input type="radio" name="seller_kind" value="private" checked={kind === 'private'} onChange={() => setKind('private')} /><span>Privatus asmuo</span></label>
        <label><input type="radio" name="seller_kind" value="agency" checked={kind === 'agency'} onChange={() => setKind('agency')} /><span>Įmonė (juridinis asmuo)</span></label>
      </div>
      <p className="hint">
        {kind === 'private'
          ? 'Jūsų vardas skelbimuose nerodomas – pirkėjai mato „Privatus pardavėjas“ ir telefoną (paspaudus).'
          : 'Skelbimuose rodomas įmonės pavadinimas ir logotipas.'}
      </p>
      {kind === 'agency' && <LogoUpload uid={uid} logoPath={logoPath} />}
      <div className="fgrid">
        <label className="field"><span>{kind === 'agency' ? 'Įmonės pavadinimas' : 'Vardas'}</span>
          <input name="full_name" autoComplete="name" defaultValue={fullName} aria-invalid={e.full_name ? true : undefined} />
          {e.full_name && <span className="err">{e.full_name}</span>}
        </label>
        <label className="field"><span>Telefonas</span>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+370 6xx xxxxx" defaultValue={phone} aria-invalid={e.phone ? true : undefined} />
          {e.phone && <span className="err">{e.phone}</span>}
        </label>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-cta" type="submit" disabled={pending}>{pending ? 'Saugoma…' : 'Išsaugoti'}</button>
        {state.message && <span className={state.ok ? 'hint' : 'form-error'} role="status">{state.message}</span>}
      </div>
    </form>
  )
}
