'use client'

import { useState, useTransition } from 'react'
import { getContactPhone } from '@/app/skelbimas/actions'

export function PhoneReveal({ listingId }: { listingId: number }) {
  const [phone, setPhone] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [pending, start] = useTransition()

  if (!phone) {
    return (
      <div className="phone-row">
        <span className="phone">+370 ••• •••••</span>
        <button className="btn btn-ghost btn-sm" type="button" disabled={pending}
          onClick={() => start(async () => {
            const p = await getContactPhone(listingId)
            if (p) setPhone(p)
            else setStatus('Numerio parodyti nepavyko. Atnaujinkite puslapį.')
          })}>
          {pending ? 'Įkeliama…' : 'Rodyti numerį'}
        </button>
        {status && <span className="form-error">{status}</span>}
      </div>
    )
  }
  return (
    <div className="phone-row">
      <a className="phone" href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>
      <button className="btn btn-ghost btn-sm" type="button"
        onClick={() => navigator.clipboard?.writeText(phone).then(() => setStatus('Nukopijuota'), () => setStatus(''))}>
        {status === 'Nukopijuota' ? 'Nukopijuota' : 'Kopijuoti'}
      </button>
    </div>
  )
}
