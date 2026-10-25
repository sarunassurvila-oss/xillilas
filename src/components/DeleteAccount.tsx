'use client'

import { useState } from 'react'
import { PHOTO_BUCKET } from '@/lib/env'
import { createClient } from '@/lib/supabase/client'

export function DeleteAccount({ uid }: { uid: string }) {
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    setBusy(true)
    setError('')
    const supabase = createClient()
    // Pirma nuotraukų failai (jų duomenų bazė pati neištrina), tada paskyra su visais skelbimais.
    const { data: photos } = await supabase.from('listing_photos').select('path').eq('owner_id', uid)
    const paths = (photos ?? []).map((p) => p.path)
    for (let i = 0; i < paths.length; i += 100) await supabase.storage.from(PHOTO_BUCKET).remove(paths.slice(i, i + 100))
    const { error } = await supabase.rpc('delete_my_account')
    if (error) {
      setError('Nepavyko ištrinti paskyros. Bandykite dar kartą arba parašykite mums.')
      setBusy(false)
      return
    }
    await supabase.auth.signOut()
    window.location.assign('/')
  }

  return (
    <section className="form-section">
      <h2>Paskyros ištrynimas</h2>
      <p className="hint">Bus negrįžtamai ištrinti jūsų profilis, visi skelbimai ir nuotraukos.</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {!armed ? (
          <button className="btn btn-danger" type="button" onClick={() => setArmed(true)}>Ištrinti paskyrą</button>
        ) : (
          <>
            <button className="btn btn-danger" type="button" disabled={busy} onClick={run}>{busy ? 'Trinama…' : 'Taip, ištrinti viską'}</button>
            <button className="btn btn-ghost" type="button" disabled={busy} onClick={() => setArmed(false)}>Atšaukti</button>
          </>
        )}
        {error && <span className="form-error" role="alert">{error}</span>}
      </div>
    </section>
  )
}
