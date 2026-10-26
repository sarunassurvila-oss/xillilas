'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { subscribeSearch } from '@/app/prenumerata/actions'

type Props = {
  /** Paieškos užklausa be „?“ (searchQueryOf). */
  query: string
  loggedIn: boolean
  subscribed: boolean
  /** Grįžus po prisijungimo su ?prenumeruoti=1 prenumerata sukuriama automatiškai. */
  auto: boolean
}

export function SubscribeButton({ query, loggedIn, subscribed, auto }: Props) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>(subscribed ? 'done' : 'idle')
  const [msg, setMsg] = useState('')
  const started = useRef(false)

  async function run() {
    setState('busy')
    const res = await subscribeSearch(query)
    if (res.ok) {
      setState('done')
      setMsg(`${res.already ? 'Šią paiešką jau prenumeruojate' : 'Prenumeruojate'}. Naujus skelbimus siųsime adresu ${res.email}.`)
    } else {
      setState('error')
      setMsg(res.message)
    }
  }

  useEffect(() => {
    if (!auto || !loggedIn || started.current) return
    started.current = true
    run().then(() => router.replace(`/${query ? `?${query}` : ''}#rezultatai`, { scroll: false }))
  }, [auto, loggedIn])

  if (!loggedIn) {
    const back = `/?${query ? `${query}&` : ''}prenumeruoti=1#rezultatai`
    return (
      <Link className="btn btn-ghost sub-btn" href={`/prisijungti?next=${encodeURIComponent(back)}`}>
        Gauti naujus skelbimus el. paštu
      </Link>
    )
  }
  if (state === 'done') {
    return (
      <p className="sub-done" role="status">
        <span>{msg || 'Šią paiešką prenumeruojate.'} <Link href="/mano/prenumeratos">Prenumeratos</Link></span>
      </p>
    )
  }
  return (
    <div className="sub-wrap">
      <button type="button" className="btn btn-ghost sub-btn" disabled={state === 'busy'} onClick={run}>
        {state === 'busy' ? 'Prenumeruojama…' : 'Gauti naujus skelbimus el. paštu'}
      </button>
      {state === 'error' && <span className="form-error" role="alert">{msg}</span>}
    </div>
  )
}
