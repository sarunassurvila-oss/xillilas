import { TYPE_KEYS, type Deal, type ListingType } from '@/lib/listings'

export const SORTS = {
  new: 'Naujausi',
  cheap: 'Pigiausi',
  dear: 'Brangiausi',
  big: 'Didžiausio ploto',
  unit: 'Mažiausia kaina už m²',
} as const
export type SortKey = keyof typeof SORTS

export type Filters = {
  deal: Deal
  type: ListingType | 'all'
  city: string
  district: string
  q: string
  pmin: number | null
  pmax: number | null
  amin: number | null
  amax: number | null
  rooms: number[]
  sort: SortKey
  page: number
}

export type SearchParams = Record<string, string | string[] | undefined>

export const PAGE_SIZE = 24
export const CITY_ORDER = ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Panevėžys', 'Palanga']
export const roomsApply = (type: Filters['type']) => type === 'all' || type === 'butas' || type === 'namas'

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
const numOrNull = (v: string) => {
  const n = Number(v.replace(/\s/g, '').replace(',', '.'))
  return v.trim() && Number.isFinite(n) && n >= 0 ? n : null
}

export function parseFilters(sp: SearchParams): Filters {
  const type = one(sp.type) as ListingType
  const sort = one(sp.sort) as SortKey
  const roomsRaw = Array.isArray(sp.rooms) ? sp.rooms : one(sp.rooms).split(',')
  const page = Math.max(1, Math.min(500, Math.floor(Number(one(sp.page)) || 1)))
  return {
    deal: one(sp.deal) === 'rent' ? 'rent' : 'sale',
    type: TYPE_KEYS.includes(type) ? type : 'all',
    city: one(sp.city).trim().slice(0, 80),
    district: one(sp.district).trim().slice(0, 80),
    q: one(sp.q).trim().slice(0, 80),
    pmin: numOrNull(one(sp.pmin)),
    pmax: numOrNull(one(sp.pmax)),
    amin: numOrNull(one(sp.amin)),
    amax: numOrNull(one(sp.amax)),
    rooms: [...new Set(roomsRaw.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 5))].sort(),
    sort: sort in SORTS ? sort : 'new',
    page,
  }
}

/** Filtrų būsena → URL užklausa (numatytosios reikšmės praleidžiamos). */
export function toQuery(f: Partial<Filters>) {
  const p = new URLSearchParams()
  if (f.deal === 'rent') p.set('deal', 'rent')
  if (f.type && f.type !== 'all') p.set('type', f.type)
  if (f.city) p.set('city', f.city)
  if (f.city && f.district) p.set('district', f.district)
  if (f.q) p.set('q', f.q)
  if (f.pmin != null) p.set('pmin', String(f.pmin))
  if (f.pmax != null) p.set('pmax', String(f.pmax))
  if (f.amin != null) p.set('amin', String(f.amin))
  if (f.amax != null) p.set('amax', String(f.amax))
  if (f.rooms?.length && roomsApply(f.type ?? 'all')) p.set('rooms', f.rooms.join(','))
  if (f.sort && f.sort !== 'new') p.set('sort', f.sort)
  if (f.page && f.page > 1) p.set('page', String(f.page))
  return p.toString()
}

export const hrefFor = (f: Partial<Filters>, hash = '#rezultatai') => {
  const q = toQuery(f)
  return `/${q ? `?${q}` : ''}${hash}`
}

/** Paieškos žodžiai be lietuviškų diakritikų (kaip duomenų bazės search_text stulpelyje). */
export function searchWords(q: string) {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9-]+/)
    .filter((w) => w.length >= 2)
    .slice(0, 5)
}

export function sortCities(list: string[]) {
  return [...list].sort((a, b) => {
    const ia = CITY_ORDER.indexOf(a), ib = CITY_ORDER.indexOf(b)
    if (ia > -1 || ib > -1) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
    return a.localeCompare(b, 'lt')
  })
}
