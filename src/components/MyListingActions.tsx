'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { deleteListing, extendListing, setListingStatus, type ActionResult } from '@/app/mano/actions'
import type { Deal, EffectiveStatus } from '@/lib/listings'

export function MyListingActions({ id, status, deal, daysLeft }: { id: number; status: EffectiveStatus; deal: Deal; daysLeft: number }) {
  const [pending, start] = useTransition()
  const [armed, setArmed] = useState(false)
  const [error, setError] = useState('')
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      setError('')
      const res = await fn()
      if (!res.ok) setError(res.message ?? 'Nepavyko. Bandykite dar kartą.')
    })

  return (
    <div className="my-actions">
      <Link className="btn btn-ghost btn-sm" href={`/mano/${id}`}>Redaguoti</Link>
      {status === 'draft' && <button className="btn btn-cta btn-sm" disabled={pending} onClick={() => run(() => setListingStatus(id, 'active'))}>Paskelbti</button>}
      {(status === 'paused' || status === 'closed') && (
        <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => run(() => setListingStatus(id, 'active'))}>Aktyvuoti vėl</button>
      )}
      {status === 'expired' && <button className="btn btn-cta btn-sm" disabled={pending} onClick={() => run(() => extendListing(id))}>Pratęsti 60 d.</button>}
      {status === 'active' && daysLeft <= 14 && (
        <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => run(() => extendListing(id))}>Pratęsti 60 d.</button>
      )}
      {(status === 'active' || status === 'expired') && (
        <>
          <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => run(() => setListingStatus(id, 'paused'))}>Pristabdyti</button>
          <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => run(() => setListingStatus(id, 'closed'))}>
            {deal === 'sale' ? 'Parduota' : 'Išnuomota'}
          </button>
        </>
      )}
      <button className="btn btn-danger btn-sm" disabled={pending}
        onBlur={() => setArmed(false)}
        onClick={() => (armed ? run(() => deleteListing(id)) : setArmed(true))}>
        {armed ? 'Spauskite dar kartą, kad ištrintumėte' : 'Ištrinti'}
      </button>
      {error && <p className="form-error" role="alert" style={{ width: '100%', textAlign: 'right' }}>{error}</p>}
    </div>
  )
}
