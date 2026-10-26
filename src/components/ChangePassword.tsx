'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PASSWORD_MIN, authErrorText } from '@/lib/username'

export function ChangePassword() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const password = String(fd.get('password') ?? '')
    if (password.length < PASSWORD_MIN) return setMsg({ ok: false, text: authErrorText('weak_password') })
    if (password !== fd.get('password2')) return setMsg({ ok: false, text: 'Slaptažodžiai nesutampa.' })
    setBusy(true)
    setMsg(null)
    const { error } = await createClient().auth.updateUser({ password })
    setBusy(false)
    if (error) return setMsg({ ok: false, text: authErrorText(error.code) })
    form.reset()
    setMsg({ ok: true, text: 'Slaptažodis pakeistas.' })
  }

  return (
    <form className="form-section" onSubmit={submit} noValidate>
      <h2>Slaptažodžio keitimas</h2>
      <p className="hint">Pamiršto slaptažodžio atkurti negalima, todėl naująjį išsisaugokite.</p>
      <div className="fgrid">
        <label className="field"><span>Naujas slaptažodis</span>
          <input name="password" type="password" required minLength={PASSWORD_MIN} autoComplete="new-password" />
        </label>
        <label className="field"><span>Pakartokite</span>
          <input name="password2" type="password" required autoComplete="new-password" />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-cta" type="submit" disabled={busy}>{busy ? 'Keičiama…' : 'Pakeisti slaptažodį'}</button>
        {msg && <span className={msg.ok ? 'hint' : 'form-error'} role="status">{msg.text}</span>}
      </div>
    </form>
  )
}
