'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PASSWORD_MIN, authErrorText, isValidEmail, normalizeEmail } from '@/lib/auth-text'

// Prisijungiama tiesiai iš naršyklės: Supabase taip mato tikrą lankytojo IP ir riboja slaptažodžių spėliojimą.
export function EmailAuth({ next }: { next: string }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [unconfirmed, setUnconfirmed] = useState('')
  const signup = mode === 'signup'

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = normalizeEmail(String(fd.get('email') ?? ''))
    const password = String(fd.get('password') ?? '')
    if (!isValidEmail(email)) return setError(authErrorText('email_address_invalid'))
    if (signup && password.length < PASSWORD_MIN) return setError(authErrorText('weak_password'))
    if (signup && password !== fd.get('password2')) return setError('Slaptažodžiai nesutampa.')

    setPending(true)
    setError('')
    setUnconfirmed('')
    const auth = createClient().auth
    if (signup) {
      const { data, error } = await auth.signUp({ email, password, options: { emailRedirectTo: callback() } })
      setPending(false)
      if (error) return setError(authErrorText(error.code))
      // Supabase neatskleidžia, kad adresas užimtas: tokiu atveju grąžina naudotoją be prisijungimo būdų.
      if (data.user && data.user.identities?.length === 0) return setError(authErrorText('user_already_exists'))
      if (data.session) return window.location.assign(next)
      return setSentTo(email)
    }
    const { error } = await auth.signInWithPassword({ email, password })
    if (error) {
      setPending(false)
      if (error.code === 'email_not_confirmed') setUnconfirmed(email)
      return setError(authErrorText(error.code))
    }
    // Pilnas perkrovimas, kad serveris iškart matytų naują sesiją.
    window.location.assign(next)
  }

  async function resend() {
    setPending(true)
    const { error } = await createClient().auth.resend({ type: 'signup', email: unconfirmed, options: { emailRedirectTo: callback() } })
    setPending(false)
    if (error) return setError(authErrorText(error.code))
    setSentTo(unconfirmed)
    setUnconfirmed('')
    setError('')
  }

  if (sentTo) {
    return (
      <div className="name-auth sent" role="status">
        <h2>Patikrinkite el. paštą</h2>
        <p>Išsiuntėme laišką adresu <b>{sentTo}</b>. Paspauskite jame esančią nuorodą, kad patvirtintumėte paskyrą.</p>
        <p className="hint">Laiško nematote? Patikrinkite „Šlamšto“ ar „Reklamų“ aplanką.</p>
        <button className="btn btn-ghost" type="button" onClick={() => { setSentTo(''); setMode('login') }}>Grįžti į prisijungimą</button>
      </div>
    )
  }

  return (
    <form className="name-auth" onSubmit={submit} noValidate>
      <div className="seg" role="radiogroup" aria-label="Paskyra su el. paštu">
        <label><input type="radio" name="mode" checked={!signup} onChange={() => { setMode('login'); setError('') }} /><span>Prisijungti</span></label>
        <label><input type="radio" name="mode" checked={signup} onChange={() => { setMode('signup'); setError('') }} /><span>Kurti paskyrą</span></label>
      </div>
      <label className="field"><span>El. paštas</span>
        <input name="email" type="email" required autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} />
      </label>
      <label className="field"><span id="pw-label">Slaptažodis</span>
        <input name="password" type="password" required minLength={signup ? PASSWORD_MIN : undefined}
          autoComplete={signup ? 'new-password' : 'current-password'} aria-labelledby="pw-label" aria-describedby={signup ? 'pw-hint' : undefined} />
        {signup && <small id="pw-hint" className="hint">Bent {PASSWORD_MIN} simboliai.</small>}
      </label>
      {signup && (
        <label className="field"><span>Pakartokite slaptažodį</span>
          <input name="password2" type="password" required autoComplete="new-password" />
        </label>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      {unconfirmed && (
        <button className="link-btn" type="button" disabled={pending} onClick={resend}>Siųsti patvirtinimo laišką dar kartą</button>
      )}
      <button className="btn btn-cta" type="submit" disabled={pending}>
        {pending ? 'Palaukite…' : signup ? 'Sukurti paskyrą' : 'Prisijungti'}
      </button>
      {!signup && <Link className="forgot" href="/slaptazodis">Pamiršote slaptažodį?</Link>}
    </form>
  )
}
