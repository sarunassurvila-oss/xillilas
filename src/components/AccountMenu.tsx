'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

export function AccountMenu({ name, email, avatar }: { name: string; email: string; avatar: string }) {
  const ref = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const close = (e: MouseEvent | KeyboardEvent) => {
      const d = ref.current
      if (!d?.open) return
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !d.contains(e.target as Node)) d.open = false
    }
    document.addEventListener('click', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('keydown', close)
    }
  }, [])
  const initial = (name || email || '?').trim().charAt(0).toUpperCase()
  return (
    <details className="acct" ref={ref}>
      <summary aria-label="Paskyros meniu">
        <span className="avatar">
          {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : initial}
        </span>
      </summary>
      <div className="acct-menu" onClick={(e) => { if ((e.target as HTMLElement).closest('a')) ref.current!.open = false }}>
        <div className="acct-who">
          <b>{name || 'Jūsų paskyra'}</b>
          <span>{email}</span>
        </div>
        <Link href="/mano">Mano skelbimai</Link>
        <Link href="/mano/naujas">Įdėti skelbimą</Link>
        <Link href="/mano/paskyra">Profilis ir kontaktai</Link>
        <form action="/auth/signout" method="post">
          <button type="submit">Atsijungti</button>
        </form>
      </div>
    </details>
  )
}
