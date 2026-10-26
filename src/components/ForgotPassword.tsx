'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { authErrorText, isValidEmail, normalizeEmail } from '@/lib/auth-text'

export function ForgotPassword() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = normalizeEmail(String(new FormData(e.currentTarget).get('email') ?? ''))
    if (!isValidEmail(email)) return setError(authErrorText('email_address_invalid'))
    setPending(true)
    setError('')
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/slaptazodis/naujas`,
    })
    setPending(false)
    if (error) return setError(authErrorText(error.code))
    setSentTo(email)
  }

  if (sentTo) {
    return (
      <div className="name-auth sent" role="status">
        <p>Jei adresu <b>{sentTo}</b> yra paskyra, išsiuntėme laišką su nuoroda naujam slaptažodžiui susikurti.</p>
        <p className="hint">Laiško nematote? Patikrinkite „Šlamšto“ ar „Reklamų“ aplanką.</p>
      </div>
    )
  }
  return (
    <form className="name-auth" onSubmit={submit} noValidate>
      <label className="field"><span>El. paštas</span>
        <input name="email" type="email" required autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn btn-cta" type="submit" disabled={pending}>{pending ? 'Siunčiama…' : 'Siųsti nuorodą'}</button>
    </form>
  )
}
