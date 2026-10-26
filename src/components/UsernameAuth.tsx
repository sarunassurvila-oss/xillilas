'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  PASSWORD_MIN, USERNAME_RULE, authErrorText, isValidUsername, normalizeUsername, usernameEmail,
} from '@/lib/username'

// Prisijungiama tiesiai iš naršyklės: Supabase taip mato tikrą lankytojo IP ir riboja slaptažodžių spėliojimą.
export function UsernameAuth({ next }: { next: string }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const signup = mode === 'signup'

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const username = normalizeUsername(String(fd.get('username') ?? ''))
    const password = String(fd.get('password') ?? '')
    if (!isValidUsername(username)) {
      return setError(signup ? `Slapyvardis netinka. ${USERNAME_RULE}.` : authErrorText('invalid_credentials'))
    }
    if (signup && password.length < PASSWORD_MIN) return setError(authErrorText('weak_password'))
    if (signup && password !== fd.get('password2')) return setError('Slaptažodžiai nesutampa.')

    setPending(true)
    setError('')
    const auth = createClient().auth
    const email = usernameEmail(username)
    const { data, error } = signup
      ? await auth.signUp({ email, password, options: { data: { username } } })
      : await auth.signInWithPassword({ email, password })
    if (error || !data.session) {
      setError(authErrorText(error?.code))
      setPending(false)
      return
    }
    // Pilnas perkrovimas, kad serveris iškart matytų naują sesiją.
    window.location.assign(next)
  }

  return (
    <form className="name-auth" onSubmit={submit} noValidate>
      <div className="seg" role="radiogroup" aria-label="Paskyra su slapyvardžiu">
        <label><input type="radio" name="mode" checked={!signup} onChange={() => { setMode('login'); setError('') }} /><span>Prisijungti</span></label>
        <label><input type="radio" name="mode" checked={signup} onChange={() => { setMode('signup'); setError('') }} /><span>Kurti paskyrą</span></label>
      </div>
      <label className="field"><span id="un-label">Slapyvardis</span>
        <input name="username" required autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={24}
          aria-labelledby="un-label" aria-describedby={signup ? 'un-hint' : undefined} />
        {signup && <small id="un-hint" className="hint">{USERNAME_RULE}.</small>}
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
      {signup && (
        <p className="hint">Paskyra nesusieta su el. paštu, todėl pamiršto slaptažodžio atkurti nebus galima. Jį išsisaugokite.</p>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn btn-cta" type="submit" disabled={pending}>
        {pending ? 'Palaukite…' : signup ? 'Sukurti paskyrą' : 'Prisijungti'}
      </button>
    </form>
  )
}
