'use client'

import { useEffect, useState } from 'react'
import { EmailAuth } from '@/components/EmailAuth'
import { LoginButtons } from '@/components/LoginButtons'

export type SellerKind = 'private' | 'agency'
const KEY = 'skelbejo-tipas'

/**
 * Prisijungimas su skelbėjo tipu. Naujai paskyrai tipas nustatomas visada, o esamai –
 * tik jei naudotojas jį čia pakeitė (kad atsitiktinai neperjungtų įmonės į privatų asmenį).
 */
export function LoginOptions({ next, withEmail }: { next: string; withEmail: boolean }) {
  const [kind, setKind] = useState<SellerKind>('private')
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    try { if (localStorage.getItem(KEY) === 'agency') setKind('agency') } catch {}
  }, [])
  const choose = (k: SellerKind) => {
    setKind(k)
    setTouched(true)
    try { localStorage.setItem(KEY, k) } catch {}
  }
  return (
    <>
      <div className="kind-pick">
        <span id="kind-label">Prisijungiu kaip</span>
        <div className="seg" role="radiogroup" aria-labelledby="kind-label">
          <label><input type="radio" name="seller_kind" checked={kind === 'private'} onChange={() => choose('private')} /><span>Privatus asmuo</span></label>
          <label><input type="radio" name="seller_kind" checked={kind === 'agency'} onChange={() => choose('agency')} /><span>Įmonė</span></label>
        </div>
        <small className="hint">
          {kind === 'private'
            ? 'Jūsų vardas skelbimuose nerodomas – rodoma „Privatus pardavėjas“.'
            : 'Juridinis asmuo: skelbimuose rodomas įmonės pavadinimas ir logotipas.'}
        </small>
      </div>
      <LoginButtons next={next} kind={kind} touched={touched} />
      {withEmail && (
        <>
          <p className="login-or"><span>arba</span></p>
          <EmailAuth next={next} kind={kind} touched={touched} />
        </>
      )}
    </>
  )
}
