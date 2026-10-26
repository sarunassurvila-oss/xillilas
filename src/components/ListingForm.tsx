'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { saveListing } from '@/app/mano/actions'
import { Icon } from '@/components/icons'
import { PHOTO_BUCKET } from '@/lib/env'
import {
  BUILDINGS, ENERGY, FEATURES, FINISHES, HEATING, PURPOSES, TYPES, TYPE_KEYS, fieldApplies, photoUrl,
  type EffectiveStatus, type ListingType,
} from '@/lib/listings'
import { ALL_CITIES, CITY_GROUPS, districtsOf } from '@/lib/locations'
import { createClient } from '@/lib/supabase/client'
import { validateListing, type ListingInput } from '@/lib/validate'

const MAX_PHOTOS = 20
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

type ExistingPhoto = { id: number; path: string; position: number }
type Item =
  | { key: string; kind: 'existing'; id: number; path: string; position: number; url: string }
  | { key: string; kind: 'new'; file: File; url: string }

/** Sumažina nuotrauką iki 1600 px ir išsaugo JPEG: greitesnis įkėlimas ir mažesnė saugykla. */
async function resizeImage(file: File, max = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', 0.82),
  )
}

type Props = {
  uid: string
  listingId?: number
  status?: EffectiveStatus
  initial: ListingInput
  photos?: ExistingPhoto[]
}

export function ListingForm({ uid, listingId, status, initial, photos = [] }: Props) {
  const router = useRouter()
  const [v, setV] = useState<ListingInput>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState('')
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const [items, setItems] = useState<Item[]>(() =>
    [...photos].sort((a, b) => a.position - b.position)
      .map((p) => ({ key: `e${p.id}`, kind: 'existing', id: p.id, path: p.path, position: p.position, url: photoUrl(p.path) })),
  )
  const [removed, setRemoved] = useState<{ id: number; path: string }[]>([])
  const itemsRef = useRef(items)
  itemsRef.current = items
  useEffect(() => () => itemsRef.current.forEach((i) => i.kind === 'new' && URL.revokeObjectURL(i.url)), [])

  const [otherDistrict, setOtherDistrict] = useState(() => Boolean(initial.district) && !districtsOf(initial.city).includes(initial.district))
  const isDraft = !listingId || status === 'draft'
  const t = v.type
  const set = <K extends keyof ListingInput>(k: K, val: ListingInput[K]) => {
    setV((s) => ({ ...s, [k]: val }))
    setErrors((e) => {
      if (!e[k]) return e
      const rest = { ...e }
      delete rest[k]
      if (Object.keys(rest).length === 0) setMessage('')
      return rest
    })
  }
  const err = (k: string) => (errors[k] ? <span className="err" id={`${k}-err`}>{errors[k]}</span> : null)
  const inv = (k: string) => (errors[k] ? { 'aria-invalid': true as const, 'aria-describedby': `${k}-err` } : {})

  function addFiles(list: FileList | File[]) {
    const files = [...list]
    const room = MAX_PHOTOS - items.length
    const ok = files.filter((f) => (ACCEPT.includes(f.type) || /\.(heic|heif)$/i.test(f.name)) && f.size <= 25 * 1024 * 1024)
    const add = ok.slice(0, Math.max(0, room))
    setItems((s) => [...s, ...add.map((file) => ({ key: `n${crypto.randomUUID()}`, kind: 'new' as const, file, url: URL.createObjectURL(file) }))])
    if (add.length < files.length) {
      setMessage(room < files.length
        ? `Vienam skelbimui galima įkelti iki ${MAX_PHOTOS} nuotraukų.`
        : 'Kai kurie failai praleisti: tinka JPG, PNG, WEBP ar HEIC nuotraukos iki 25 MB.')
    }
  }
  function move(i: number, to: number) {
    setItems((s) => {
      const n = [...s]
      const [it] = n.splice(i, 1)
      n.splice(to, 0, it)
      return n
    })
  }
  function remove(i: number) {
    const it = items[i]
    if (it.kind === 'existing') setRemoved((r) => [...r, { id: it.id, path: it.path }])
    else URL.revokeObjectURL(it.url)
    setItems((s) => s.filter((_, k) => k !== i))
  }

  async function syncPhotos(id: number) {
    const supabase = createClient()
    if (removed.length) {
      const { error } = await supabase.from('listing_photos').delete().in('id', removed.map((r) => r.id))
      if (error) throw error
      await supabase.storage.from(PHOTO_BUCKET).remove(removed.map((r) => r.path))
    }
    const total = items.filter((i) => i.kind === 'new').length
    let done = 0
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (it.kind === 'new') {
        setProgress(`Įkeliamos nuotraukos: ${done + 1} iš ${total}`)
        const blob = await resizeImage(it.file)
        const path = `${uid}/${id}/${crypto.randomUUID()}.jpg`
        const up = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
        if (up.error) throw up.error
        const ins = await supabase.from('listing_photos').insert({ listing_id: id, path, position: i })
        if (ins.error) {
          await supabase.storage.from(PHOTO_BUCKET).remove([path])
          throw ins.error
        }
        done++
      } else if (it.position !== i) {
        const { error } = await supabase.from('listing_photos').update({ position: i }).eq('id', it.id)
        if (error) throw error
      }
    }
  }

  async function submit(publish: 'active' | 'draft' | 'keep') {
    setMessage('')
    const local = validateListing(v)
    if (!local.row) {
      setErrors(local.errors)
      setMessage('Patikrinkite pažymėtus laukus.')
      const first = Object.keys(local.errors)[0]
      document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    setBusy(true)
    const res = await saveListing(v, publish, listingId)
    if (!res.ok) {
      setErrors(res.errors)
      setMessage(res.message)
      setBusy(false)
      return
    }
    try {
      await syncPhotos(res.id)
    } catch {
      setBusy(false)
      setProgress('')
      router.replace(`/mano/${res.id}?nuotraukos=klaida`)
      router.refresh()
      return
    }
    const ok = publish === 'draft' ? 'juodrastis' : publish === 'active' ? 'paskelbta' : 'issaugota'
    router.push(`/mano?ok=${ok}`)
    router.refresh()
  }

  const features = FEATURES[t]
  const purposes = PURPOSES[t] ?? []

  return (
    <form className="form" noValidate onSubmit={(e) => { e.preventDefault(); submit(isDraft ? 'active' : 'keep') }}>
      <fieldset className="form-section">
        <legend>Kas parduodama ar nuomojama</legend>
        <div className="seg" role="radiogroup" aria-label="Sandorio tipas">
          <label><input type="radio" name="deal" value="sale" checked={v.deal === 'sale'} onChange={() => set('deal', 'sale')} /><span>Parduodu</span></label>
          <label><input type="radio" name="deal" value="rent" checked={v.deal === 'rent'} onChange={() => set('deal', 'rent')} /><span>Nuomoju</span></label>
        </div>
        <div className="fgrid">
          <label className="field"><span>Kategorija</span>
            <select name="type" value={t} onChange={(e) => set('type', e.target.value as ListingType)}>
              {TYPE_KEYS.map((k) => <option key={k} value={k}>{TYPES[k].one}</option>)}
            </select>
          </label>
          {fieldApplies('purpose', t) && (
            <label className="field"><span>Paskirtis</span>
              <select name="purpose" value={v.purpose} onChange={(e) => set('purpose', e.target.value)} {...inv('purpose')}>
                <option value="">Pasirinkite</option>
                {purposes.map((p) => <option key={p}>{p}</option>)}
              </select>
              {err('purpose')}
            </label>
          )}
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Vieta</legend>
        <div className="fgrid">
          <label className="field"><span>Miestas ar rajonas</span>
            <select name="city" value={v.city} onChange={(e) => { set('city', e.target.value); set('district', ''); setOtherDistrict(false) }} {...inv('city')}>
              <option value="">Pasirinkite</option>
              {CITY_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>{g.cities.map((c) => <option key={c}>{c}</option>)}</optgroup>
              ))}
              {v.city && !ALL_CITIES.includes(v.city) && <option>{v.city}</option>}
            </select>
            {err('city')}
          </label>
          <label className="field"><span>Mikrorajonas ar gyvenvietė</span>
            <select name="district" value={otherDistrict ? '__other' : v.district} disabled={!v.city} {...inv('district')}
              onChange={(e) => {
                const other = e.target.value === '__other'
                setOtherDistrict(other)
                set('district', other ? '' : e.target.value)
              }}>
              <option value="">{v.city ? 'Pasirinkite' : 'Pirma pasirinkite miestą'}</option>
              {districtsOf(v.city).map((d) => <option key={d}>{d}</option>)}
              <option value="__other">Kita (įrašysiu pats)</option>
            </select>
            {otherDistrict && (
              <input name="district_other" autoComplete="off" placeholder="Įrašykite mikrorajoną ar gyvenvietę" aria-label="Kitas mikrorajonas ar gyvenvietė"
                value={v.district} onChange={(e) => set('district', e.target.value)} />
            )}
            {err('district')}
          </label>
          <label className="field"><span>Gatvė</span>
            <input name="street" autoComplete="off" placeholder="pvz. Kalvarijų g." value={v.street} onChange={(e) => set('street', e.target.value)} {...inv('street')} />
            {err('street') ?? <span className="hint">Namo numerį rašykite tik jei norite, kad jis būtų matomas.</span>}
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Kaina ir plotas</legend>
        <div className="fgrid">
          <label className="field"><span>{v.deal === 'rent' ? 'Kaina, €/mėn.' : 'Kaina, €'}</span>
            <input name="price" type="number" inputMode="numeric" min={0} value={v.price} onChange={(e) => set('price', e.target.value)} {...inv('price')} />
            {err('price')}
          </label>
          <label className="field"><span>{t === 'sklypas' ? 'Sklypo plotas, a' : 'Plotas, m²'}</span>
            <input name="area" type="number" inputMode="decimal" min={0} step="0.01" value={v.area} onChange={(e) => set('area', e.target.value)} {...inv('area')} />
            {err('area') ?? (t === 'sklypas' ? <span className="hint">1 aras = 100 m²</span> : null)}
          </label>
          {fieldApplies('rooms', t) && (
            <label className="field"><span>Kambarių sk.</span>
              <input name="rooms" type="number" inputMode="numeric" min={1} max={50} value={v.rooms} onChange={(e) => set('rooms', e.target.value)} {...inv('rooms')} />
              {err('rooms')}
            </label>
          )}
          {fieldApplies('floor', t) && (
            <label className="field"><span>Aukštas</span>
              <input name="floor" type="number" inputMode="numeric" value={v.floor} onChange={(e) => set('floor', e.target.value)} {...inv('floor')} />
              {err('floor')}
            </label>
          )}
          {fieldApplies('floors', t) && (
            <label className="field"><span>Aukštų sk. pastate</span>
              <input name="floors" type="number" inputMode="numeric" min={1} value={v.floors} onChange={(e) => set('floors', e.target.value)} {...inv('floors')} />
              {err('floors')}
            </label>
          )}
          {fieldApplies('plot', t) && (
            <label className="field"><span>Sklypo plotas, a</span>
              <input name="plot" type="number" inputMode="decimal" min={0} step="0.01" value={v.plot} onChange={(e) => set('plot', e.target.value)} {...inv('plot')} />
              {err('plot')}
            </label>
          )}
          {fieldApplies('year', t) && (
            <label className="field"><span>Statybos metai</span>
              <input name="year" type="number" inputMode="numeric" min={1500} value={v.year} onChange={(e) => set('year', e.target.value)} {...inv('year')} />
              {err('year')}
            </label>
          )}
        </div>
      </fieldset>

      {fieldApplies('building', t) && (
        <fieldset className="form-section">
          <legend>Pastatas</legend>
          <div className="fgrid">
            <label className="field"><span>Pastato tipas</span>
              <select name="building" value={v.building} onChange={(e) => set('building', e.target.value)}>
                <option value="">Nenurodyta</option>
                {BUILDINGS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </label>
            {fieldApplies('heating', t) && (
              <label className="field"><span>Šildymas</span>
                <select name="heating" value={v.heating} onChange={(e) => set('heating', e.target.value)}>
                  <option value="">Nenurodyta</option>
                  {HEATING.map((b) => <option key={b}>{b}</option>)}
                </select>
              </label>
            )}
            {fieldApplies('finish', t) && (
              <label className="field"><span>Įrengimas</span>
                <select name="finish" value={v.finish} onChange={(e) => set('finish', e.target.value)}>
                  <option value="">Nenurodyta</option>
                  {FINISHES.map((b) => <option key={b}>{b}</option>)}
                </select>
              </label>
            )}
            {fieldApplies('energy', t) && (
              <label className="field"><span>Energinė klasė</span>
                <select name="energy" value={v.energy} onChange={(e) => set('energy', e.target.value)}>
                  <option value="">Nežinoma</option>
                  {ENERGY.map((b) => <option key={b}>{b}</option>)}
                </select>
              </label>
            )}
          </div>
        </fieldset>
      )}

      <fieldset className="form-section">
        <legend>Ypatybės</legend>
        <div className="checks">
          {features.map((f) => (
            <label key={f}>
              <input type="checkbox" checked={v.features.includes(f)}
                onChange={(e) => set('features', e.target.checked ? [...v.features, f] : v.features.filter((x) => x !== f))} />
              <span>{f}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Nuotraukos <span className="hint" style={{ fontFamily: 'var(--font-body)' }}>{items.length} / {MAX_PHOTOS}</span></legend>
        <div className="photos">
          {items.map((it, i) => (
            <div className="photo" key={it.key}>
              <img src={it.url} alt={`Nuotrauka ${i + 1}`} />
              {i === 0 && <span className="badge new cover">Pagrindinė</span>}
              <div className="photo-tools">
                <span style={{ display: 'flex', gap: 4 }}>
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Perkelti kairėn"><Icon name="left" /></button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Perkelti dešinėn"><Icon name="right" /></button>
                  {i > 0 && <button type="button" onClick={() => move(i, 0)} aria-label="Padaryti pagrindine"><Icon name="star" /></button>}
                </span>
                <button type="button" onClick={() => remove(i)} aria-label="Pašalinti nuotrauką"><Icon name="trash" /></button>
              </div>
            </div>
          ))}
          {items.length < MAX_PHOTOS && (
            <label className={`photo-add${drag ? ' drag' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}>
              <input type="file" accept={ACCEPT.join(',')} multiple onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }} />
              <span><Icon name="camera" /><br />Pridėti nuotraukų<br /><small className="hint">arba nutempkite jas čia</small></span>
            </label>
          )}
        </div>
        <p className="hint">Pirma nuotrauka rodoma paieškoje. Nuotraukos sumažinamos automatiškai, todėl tinka ir tiesiai iš telefono.</p>
      </fieldset>

      <fieldset className="form-section">
        <legend>Aprašymas</legend>
        <label className="field">
          <span className="sr-only">Aprašymas</span>
          <textarea name="description" maxLength={5000} value={v.description} onChange={(e) => set('description', e.target.value)}
            placeholder="Kuo išsiskiria jūsų objektas: vaizdas pro langą, remontas, kaimynystė, susisiekimas, mokesčiai." />
          <span className="hint">{v.description.length} / 5000</span>
        </label>
      </fieldset>

      <fieldset className="form-section">
        <legend>Kontaktai</legend>
        <div className="fgrid">
          <label className="field"><span>Vardas ar įmonė</span>
            <input name="contact_name" autoComplete="name" value={v.contact_name} onChange={(e) => set('contact_name', e.target.value)} {...inv('contact_name')} />
            {err('contact_name')}
          </label>
          <label className="field"><span>Telefonas</span>
            <input name="contact_phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+370 6xx xxxxx" value={v.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} {...inv('contact_phone')} />
            {err('contact_phone') ?? <span className="hint">Rodomas tik paspaudus „Rodyti numerį“.</span>}
          </label>
        </div>
      </fieldset>

      <div className="form-actions">
        {(message || progress) && <p className={progress && !message ? 'hint' : 'form-error'} role="status">{message || progress}</p>}
        <Link className="btn btn-ghost" href="/mano">Atšaukti</Link>
        {isDraft ? (
          <>
            <button className="btn btn-ghost" type="button" disabled={busy} onClick={() => submit('draft')}>Išsaugoti juodraštį</button>
            <button className="btn btn-cta btn-lg" type="submit" disabled={busy}>{busy ? 'Saugoma…' : 'Paskelbti'}</button>
          </>
        ) : (
          <button className="btn btn-cta btn-lg" type="submit" disabled={busy}>{busy ? 'Saugoma…' : 'Išsaugoti pakeitimus'}</button>
        )}
      </div>
    </form>
  )
}
