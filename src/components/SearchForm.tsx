'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState, useTransition } from 'react'
import { accWord } from '@/lib/listings'
import { roomsApply, sortCities, toQuery, type Filters } from '@/lib/filters'

type Location = { city: string; district: string }
type Form = {
  deal: Filters['deal']; type: Filters['type']; city: string; district: string; q: string
  pmin: string; pmax: string; amin: string; amax: string; rooms: number[]
}

const toForm = (f: Filters): Form => ({
  deal: f.deal, type: f.type, city: f.city, district: f.district, q: f.q,
  pmin: f.pmin?.toString() ?? '', pmax: f.pmax?.toString() ?? '', amin: f.amin?.toString() ?? '', amax: f.amax?.toString() ?? '',
  rooms: f.rooms,
})
const n = (v: string) => (v.trim() && Number.isFinite(Number(v)) ? Number(v) : null)

export function SearchForm({ filters, locations, total }: { filters: Filters; locations: Location[]; total: number }) {
  const router = useRouter()
  const [form, setForm] = useState<Form>(() => toForm(filters))
  const [pending, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const cities = useMemo(() => sortCities([...new Set(locations.map((l) => l.city))]), [locations])
  const districts = useMemo(
    () => locations.filter((l) => l.city === form.city).map((l) => l.district).sort((a, b) => a.localeCompare(b, 'lt')),
    [locations, form.city],
  )

  function go(next: Form, scroll = false) {
    clearTimeout(timer.current)
    const qs = toQuery({
      deal: next.deal, type: next.type, city: next.city, district: next.district, q: next.q.trim(),
      pmin: n(next.pmin), pmax: n(next.pmax), amin: n(next.amin), amax: n(next.amax), rooms: next.rooms,
      sort: filters.sort,
    })
    startTransition(() => {
      if (scroll) router.push(`/${qs ? `?${qs}` : ''}#rezultatai`)
      else router.replace(`/${qs ? `?${qs}` : ''}`, { scroll: false })
    })
  }
  function update(patch: Partial<Form>, mode: 'now' | 'later' = 'now') {
    const next = { ...form, ...patch }
    setForm(next)
    if (mode === 'now') go(next)
    else {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => go(next), 500)
    }
  }
  const toggleRoom = (r: number) =>
    update({ rooms: form.rooms.includes(r) ? form.rooms.filter((x) => x !== r) : [...form.rooms, r].sort() })

  const rent = form.deal === 'rent'
  return (
    <form className="search" action="/" method="get" role="search" aria-label="Skelbimų paieška"
      onSubmit={(e) => { e.preventDefault(); go(form, true) }}>
      <div className="seg" role="radiogroup" aria-label="Sandorio tipas">
        <label><input type="radio" name="deal" value="sale" checked={!rent} onChange={() => update({ deal: 'sale', pmin: '', pmax: '' })} /><span>Pirkti</span></label>
        <label><input type="radio" name="deal" value="rent" checked={rent} onChange={() => update({ deal: 'rent', pmin: '', pmax: '' })} /><span>Nuomotis</span></label>
      </div>
      <div className="fields">
        <label className="field"><span>Kategorija</span>
          <select name="type" value={form.type} onChange={(e) => update({ type: e.target.value as Form['type'] })}>
            <option value="all">Visos kategorijos</option>
            <option value="butas">Butai</option>
            <option value="namas">Namai</option>
            <option value="sklypas">Sklypai</option>
            <option value="patalpos">Patalpos</option>
            <option value="garazas">Garažai</option>
          </select>
        </label>
        <label className="field"><span>Miestas</span>
          <select name="city" value={form.city} onChange={(e) => update({ city: e.target.value, district: '' })}>
            <option value="">Visa Lietuva</option>
            {cities.map((c) => <option key={c}>{c}</option>)}
            {form.city && !cities.includes(form.city) && <option>{form.city}</option>}
          </select>
        </label>
        <label className="field"><span>Mikrorajonas</span>
          <select name="district" value={form.district} disabled={!form.city} onChange={(e) => update({ district: e.target.value })}>
            <option value="">{form.city ? 'Visi mikrorajonai' : 'Pirma pasirinkite miestą'}</option>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label className="field"><span>Paieška</span>
          <input name="q" type="search" value={form.q} placeholder="Gatvė ar žodis, pvz. balkonas" autoComplete="off"
            onChange={(e) => update({ q: e.target.value }, 'later')} />
        </label>
        <fieldset className="field"><legend>{rent ? 'Kaina, €/mėn.' : 'Kaina, €'}</legend>
          <div className="pair">
            <input name="pmin" type="number" inputMode="numeric" min={0} placeholder="nuo" aria-label="Kaina nuo" value={form.pmin} onChange={(e) => update({ pmin: e.target.value }, 'later')} />
            <input name="pmax" type="number" inputMode="numeric" min={0} placeholder="iki" aria-label="Kaina iki" value={form.pmax} onChange={(e) => update({ pmax: e.target.value }, 'later')} />
          </div>
        </fieldset>
        <fieldset className="field"><legend>{form.type === 'sklypas' ? 'Plotas, a' : 'Plotas, m²'}</legend>
          <div className="pair">
            <input name="amin" type="number" inputMode="numeric" min={0} placeholder="nuo" aria-label="Plotas nuo" value={form.amin} onChange={(e) => update({ amin: e.target.value }, 'later')} />
            <input name="amax" type="number" inputMode="numeric" min={0} placeholder="iki" aria-label="Plotas iki" value={form.amax} onChange={(e) => update({ amax: e.target.value }, 'later')} />
          </div>
        </fieldset>
        {roomsApply(form.type) && (
          <fieldset className="field"><legend>Kambariai</legend>
            <div className="rooms">
              {[1, 2, 3, 4, 5].map((r) => (
                <label key={r}>
                  <input type="checkbox" name="rooms" value={r} checked={form.rooms.includes(r)} onChange={() => toggleRoom(r)} />
                  <span>{r === 5 ? '5+' : r}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <div className="f-submit">
          <button className="btn btn-cta" type="submit" disabled={pending}>
            {pending ? 'Ieškoma…' : total ? `Rodyti ${total} ${accWord(total)}` : 'Skelbimų nerasta'}
          </button>
        </div>
      </div>
    </form>
  )
}
