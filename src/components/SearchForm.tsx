'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState, useTransition } from 'react'
import { Icon } from '@/components/icons'
import { StreetInput } from '@/components/StreetInput'
import { ENERGY, accWord } from '@/lib/listings'
import {
  ADV_LISTS, DAYS, advApplies, advancedCount, featuresFor, purposesFor, roomsApply, toQuery, type Filters,
} from '@/lib/filters'
import { ALL_CITIES, CITY_GROUPS, districtsOf } from '@/lib/locations'

type Location = { city: string; district: string }
const NUMS = ['pmin', 'pmax', 'amin', 'amax', 'fmin', 'fmax', 'ymin', 'ymax', 'plmin', 'plmax', 'umin', 'umax'] as const
type NumKey = (typeof NUMS)[number]
type Form = Record<NumKey, string> & {
  deal: Filters['deal']; type: Filters['type']; city: string; district: string; q: string; rooms: number[]
  notFirst: boolean; notLast: boolean; photos: boolean; days: string; energy: string; purpose: string
  building: string[]; heating: string[]; finish: string[]; features: string[]
}

const toForm = (f: Filters): Form => ({
  deal: f.deal, type: f.type, city: f.city, district: f.district, q: f.q, rooms: f.rooms,
  ...(Object.fromEntries(NUMS.map((k) => [k, f[k]?.toString() ?? ''])) as Record<NumKey, string>),
  notFirst: f.notFirst, notLast: f.notLast, photos: f.photos, days: f.days?.toString() ?? '', energy: f.energy, purpose: f.purpose,
  building: f.building, heating: f.heating, finish: f.finish, features: f.features,
})
const n = (v: string) => (v.trim() && Number.isFinite(Number(v)) ? Number(v) : null)
const ADV_EMPTY: Partial<Form> = {
  fmin: '', fmax: '', ymin: '', ymax: '', plmin: '', plmax: '', umin: '', umax: '',
  notFirst: false, notLast: false, photos: false, days: '', energy: '', purpose: '', building: [], heating: [], finish: [], features: [],
}
// Išsamios paieškos skydelio būsena išlieka, kol naršoma svetainėje.
let advOpenMemory = false

export function SearchForm({ filters, locations, total }: { filters: Filters; locations: Location[]; total: number }) {
  const router = useRouter()
  const [form, setForm] = useState<Form>(() => toForm(filters))
  const [pending, startTransition] = useTransition()
  const advCount = advancedCount(filters)
  const [advOpen, setAdvOpen] = useState(() => {
    if (advCount > 0) advOpenMemory = true
    return advOpenMemory
  })
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Visi Lietuvos miestai ir papildomai vietos, kurias skelbėjai įrašė patys.
  const extraCities = useMemo(
    () => [...new Set(locations.map((l) => l.city))].filter((c) => !ALL_CITIES.includes(c)).sort((a, b) => a.localeCompare(b, 'lt')),
    [locations],
  )
  const districts = useMemo(
    () => [...new Set([...districtsOf(form.city), ...locations.filter((l) => l.city === form.city).map((l) => l.district)])]
      .sort((a, b) => a.localeCompare(b, 'lt')),
    [locations, form.city],
  )

  function go(next: Form, scroll = false) {
    clearTimeout(timer.current)
    const qs = toQuery({
      deal: next.deal, type: next.type, city: next.city, district: next.district, q: next.q.trim(), rooms: next.rooms,
      ...(Object.fromEntries(NUMS.map((k) => [k, n(next[k])])) as Record<NumKey, number | null>),
      notFirst: next.notFirst, notLast: next.notLast, photos: next.photos, days: next.days ? Number(next.days) : null,
      energy: next.energy, purpose: next.purpose, building: next.building, heating: next.heating, finish: next.finish, features: next.features,
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
  const toggleIn = (key: 'building' | 'heating' | 'finish' | 'features', v: string) =>
    update({ [key]: form[key].includes(v) ? form[key].filter((x) => x !== v) : [...form[key], v] })
  const numPair = (label: string, a: NumKey, b: NumKey) => (
    <fieldset className="field"><legend>{label}</legend>
      <div className="pair">
        <input name={a} type="number" inputMode="numeric" min={0} placeholder="nuo" aria-label={`${label} nuo`} value={form[a]} onChange={(e) => update({ [a]: e.target.value }, 'later')} />
        <input name={b} type="number" inputMode="numeric" min={0} placeholder="iki" aria-label={`${label} iki`} value={form[b]} onChange={(e) => update({ [b]: e.target.value }, 'later')} />
      </div>
    </fieldset>
  )
  const chips = (label: string, key: 'building' | 'heating' | 'finish' | 'features', options: string[]) => (
    <fieldset className="field span-all"><legend>{label}</legend>
      <div className="checks">
        {options.map((o) => (
          <label key={o}><input type="checkbox" checked={form[key].includes(o)} onChange={() => toggleIn(key, o)} /><span>{o}</span></label>
        ))}
      </div>
    </fieldset>
  )
  const t = form.type
  const purposes = purposesFor(t)
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
            {CITY_GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>{g.cities.map((c) => <option key={c}>{c}</option>)}</optgroup>
            ))}
            {extraCities.length > 0 && <optgroup label="Kita">{extraCities.map((c) => <option key={c}>{c}</option>)}</optgroup>}
            {form.city && !ALL_CITIES.includes(form.city) && !extraCities.includes(form.city) && <option>{form.city}</option>}
          </select>
        </label>
        <label className="field"><span>Mikrorajonas</span>
          <select name="district" value={form.district} disabled={!form.city} onChange={(e) => update({ district: e.target.value })}>
            <option value="">{form.city ? 'Visi mikrorajonai' : 'Pirma pasirinkite miestą'}</option>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label className="field"><span>Paieška</span>
          <StreetInput city={form.city} district={form.district} value={form.q}
            onChange={(q) => update({ q }, 'later')} onPick={(q) => update({ q })}
            inputProps={{ name: 'q', type: 'search', placeholder: form.city ? 'Gatvė ar žodis, pvz. balkonas' : 'Žodis, pvz. balkonas (gatvėms pasirinkite miestą)' }} />
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

      <div className="adv-bar">
        <button type="button" className="adv-toggle" aria-expanded={advOpen} aria-controls="adv-panel"
          onClick={() => { advOpenMemory = !advOpen; setAdvOpen(!advOpen) }}>
          <Icon name="sliders" />
          Išsami paieška
          {advCount > 0 && <span className="adv-count">{advCount}</span>}
          <Icon name="chevron" className="ico adv-chev" />
        </button>
        {advCount > 0 && <button type="button" className="link-btn" onClick={() => update(ADV_EMPTY)}>Išvalyti išsamius filtrus</button>}
      </div>

      {advOpen && (
        <div className="fields adv-panel" id="adv-panel">
          {advApplies('floor', t) && (
            <fieldset className="field"><legend>Aukštas</legend>
              <div className="pair">
                <input name="fmin" type="number" inputMode="numeric" placeholder="nuo" aria-label="Aukštas nuo" value={form.fmin} onChange={(e) => update({ fmin: e.target.value }, 'later')} />
                <input name="fmax" type="number" inputMode="numeric" placeholder="iki" aria-label="Aukštas iki" value={form.fmax} onChange={(e) => update({ fmax: e.target.value }, 'later')} />
              </div>
            </fieldset>
          )}
          {advApplies('floor', t) && (
            <fieldset className="field"><legend>Aukšto vieta</legend>
              <div className="checks">
                <label><input type="checkbox" checked={form.notFirst} onChange={(e) => update({ notFirst: e.target.checked })} /><span>Ne pirmas</span></label>
                <label><input type="checkbox" checked={form.notLast} onChange={(e) => update({ notLast: e.target.checked })} /><span>Ne paskutinis</span></label>
              </div>
            </fieldset>
          )}
          {advApplies('year', t) && numPair('Statybos metai', 'ymin', 'ymax')}
          {numPair(t === 'sklypas' ? 'Kaina už arą, €' : rent ? 'Kaina už m², €/mėn.' : 'Kaina už m², €', 'umin', 'umax')}
          {advApplies('plot', t) && numPair('Sklypo plotas, a', 'plmin', 'plmax')}
          {advApplies('energy', t) && (
            <label className="field"><span>Energinė klasė</span>
              <select name="en" value={form.energy} onChange={(e) => update({ energy: e.target.value })}>
                <option value="">Nesvarbu</option>
                {ENERGY.slice(0, 6).map((c) => <option key={c} value={c}>{c === 'A++' ? 'A++' : `${c} ar geresnė`}</option>)}
              </select>
            </label>
          )}
          {advApplies('purpose', t) && purposes.length > 0 && (
            <label className="field"><span>Paskirtis</span>
              <select name="purpose" value={form.purpose} onChange={(e) => update({ purpose: e.target.value })}>
                <option value="">Visos</option>
                {purposes.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
          )}
          <label className="field"><span>Įdėta</span>
            <select name="days" value={form.days} onChange={(e) => update({ days: e.target.value })}>
              <option value="">Bet kada</option>
              {DAYS.map((d) => <option key={d} value={d}>{d === 1 ? 'Per 24 valandas' : `Per ${d} ${d % 10 === 0 ? 'dienų' : 'dienas'}`}</option>)}
            </select>
          </label>
          <fieldset className="field"><legend>Nuotraukos</legend>
            <div className="checks">
              <label><input type="checkbox" checked={form.photos} onChange={(e) => update({ photos: e.target.checked })} /><span>Tik su nuotraukomis</span></label>
            </div>
          </fieldset>
          {advApplies('building', t) && chips('Pastato tipas', 'building', ADV_LISTS.building)}
          {advApplies('heating', t) && chips('Šildymas', 'heating', ADV_LISTS.heating)}
          {advApplies('finish', t) && chips('Įrengimas', 'finish', ADV_LISTS.finish)}
          {chips('Ypatybės', 'features', featuresFor(t))}
        </div>
      )}
    </form>
  )
}
