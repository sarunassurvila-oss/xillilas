'use client'

import { useTransition } from 'react'
import { deleteSubscription, setSubscriptionActive } from '@/app/prenumerata/actions'

export function SubscriptionActions({ id, active }: { id: number; active: boolean }) {
  const [pending, start] = useTransition()
  return (
    <div className="sub-actions">
      <button type="button" className="btn btn-ghost" disabled={pending}
        onClick={() => start(async () => { await setSubscriptionActive(id, !active) })}>
        {active ? 'Sustabdyti' : 'Įjungti'}
      </button>
      <button type="button" className="link-btn danger" disabled={pending}
        onClick={() => start(async () => { await deleteSubscription(id) })}>
        Ištrinti
      </button>
    </div>
  )
}
