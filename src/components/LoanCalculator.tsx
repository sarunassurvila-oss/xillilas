'use client'

import { useState } from 'react'
import { fmt } from '@/lib/listings'

/** Anuiteto įmoka; Lietuvoje minimalus pradinis įnašas būstui yra 15 %. */
export function LoanCalculator({ price }: { price: number }) {
  const [down, setDown] = useState(15)
  const [years, setYears] = useState(30)
  const [rate, setRate] = useState('3.6')
  const r = Math.max(0, Number(rate.replace(',', '.')) || 0)
  const P = price * (1 - down / 100), n = years * 12, m = r / 100 / 12
  const pay = m ? (P * m) / (1 - Math.pow(1 + m, -n)) : P / n
  return (
    <section className="box" aria-labelledby="loanH">
      <h2 id="loanH">Būsto paskolos skaičiuoklė</h2>
      <div className="loan-row"><label htmlFor="lDown">Pradinis įnašas</label><output htmlFor="lDown">{down} % · {fmt((price * down) / 100)} €</output></div>
      <input type="range" id="lDown" min={15} max={60} step={5} value={down} onChange={(e) => setDown(Number(e.target.value))} />
      <div className="loan-row"><label htmlFor="lYears">Terminas</label><output htmlFor="lYears">{years} m.</output></div>
      <input type="range" id="lYears" min={5} max={30} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} />
      <div className="loan-row"><label htmlFor="lRate">Palūkanų norma, %</label>
        <input id="lRate" type="number" min={0} max={15} step={0.1} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
      </div>
      <div className="loan-out"><span>Mėnesio įmoka</span><strong>{fmt(pay)} €</strong></div>
      <dl className="loan-meta">
        <div><dt>Paskolos suma</dt><dd>{fmt(P)} €</dd></div>
        <div><dt>Palūkanos per visą laikotarpį</dt><dd>{fmt(pay * n - P)} €</dd></div>
      </dl>
      <p className="note">Orientacinis skaičiavimas. Tikslų pasiūlymą pateiks bankas.</p>
    </section>
  )
}
