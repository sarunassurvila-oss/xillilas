import { BUILDINGS, ENERGY, FEATURES, FINISHES, HEATING, PURPOSES, TYPES, TYPE_KEYS, fmt, type Deal, type ListingType } from '@/lib/listings'

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
  /** Pasirinkti mikrorajonai (taikoma tik pasirinkus miestą). */
  districts: string[]
  q: string
  pmin: number | null
  pmax: number | null
  amin: number | null
  amax: number | null
  rooms: number[]
  sort: SortKey
  page: number
  /** Rezultatai sąraše arba žemėlapyje. */
  view: 'list' | 'map'
  // Išsami paieška
  fmin: number | null
  fmax: number | null
  notFirst: boolean
  notLast: boolean
  ymin: number | null
  ymax: number | null
  plmin: number | null
  plmax: number | null
  umin: number | null
  umax: number | null
  building: string[]
  heating: string[]
  finish: string[]
  energy: string
  purpose: string
  features: string[]
  days: number | null
  photos: boolean
}

type AnyType = Filters['type']
/** Kuriai kategorijai rodomas kiekvienas išsamios paieškos filtras. */
const ADV_TYPES: Record<string, AnyType[]> = {
  floor: ['all', 'butas', 'patalpos'],
  year: ['all', 'butas', 'namas', 'patalpos', 'garazas'],
  plot: ['namas'],
  building: ['all', 'butas', 'namas', 'patalpos', 'garazas'],
  heating: ['all', 'butas', 'namas', 'patalpos'],
  finish: ['all', 'butas', 'namas', 'patalpos'],
  energy: ['all', 'butas', 'namas', 'patalpos'],
  purpose: ['sklypas', 'patalpos'],
}
export const advApplies = (field: keyof typeof ADV_TYPES | string, type: AnyType) => !ADV_TYPES[field] || ADV_TYPES[field].includes(type)
export const COMMON_FEATURES = ['Balkonas', 'Terasa', 'Vieta automobiliui', 'Garažas', 'Liftas', 'Su baldais', 'Rekuperacija', 'Prie ežero']
export const featuresFor = (type: AnyType) => (type === 'all' ? COMMON_FEATURES : FEATURES[type])
export const purposesFor = (type: AnyType) => (type === 'all' ? [] : PURPOSES[type] ?? [])
export const DAYS = [1, 7, 30]
export const ADV_LISTS = { building: BUILDINGS, heating: HEATING, finish: FINISHES }

export const ADV_DEFAULTS = {
  fmin: null, fmax: null, notFirst: false, notLast: false, ymin: null, ymax: null, plmin: null, plmax: null, umin: null, umax: null,
  building: [], heating: [], finish: [], energy: '', purpose: '', features: [], days: null, photos: false,
} satisfies Partial<Filters>

/** Kiek išsamios paieškos filtrų įjungta (tik tie, kurie tinka kategorijai). */
export function advancedCount(f: Filters) {
  const t = f.type
  let c = 0
  if (advApplies('floor', t)) c += Number(f.fmin != null || f.fmax != null) + Number(f.notFirst) + Number(f.notLast)
  if (advApplies('year', t)) c += Number(f.ymin != null || f.ymax != null)
  if (advApplies('plot', t)) c += Number(f.plmin != null || f.plmax != null)
  c += Number(f.umin != null || f.umax != null)
  for (const k of ['building', 'heating', 'finish'] as const) if (advApplies(k, t)) c += Number(f[k].length > 0)
  if (advApplies('energy', t)) c += Number(Boolean(f.energy))
  if (advApplies('purpose', t)) c += Number(Boolean(f.purpose))
  c += Number(f.features.length > 0) + Number(f.days != null) + Number(f.photos)
  return c
}

export type SearchParams = Record<string, string | string[] | undefined>

export const PAGE_SIZE = 24
export const roomsApply = (type: Filters['type']) => type === 'all' || type === 'butas' || type === 'namas'

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
const list = (v: string | string[] | undefined, allowed: string[]) =>
  [...new Set((Array.isArray(v) ? v : one(v).split(',')).map((x) => x.trim()).filter((x) => allowed.includes(x)))]
/** Laisvo teksto sąrašas iš URL („a,b“ arba pakartoti parametrai), pvz. mikrorajonai. */
const many = (v: string | string[] | undefined, max = 30) =>
  [...new Set((Array.isArray(v) ? v : one(v).split(',')).map((x) => x.trim().slice(0, 80)).filter(Boolean))].slice(0, max)
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
    districts: many(sp.district),
    q: one(sp.q).trim().slice(0, 80),
    pmin: numOrNull(one(sp.pmin)),
    pmax: numOrNull(one(sp.pmax)),
    amin: numOrNull(one(sp.amin)),
    amax: numOrNull(one(sp.amax)),
    rooms: [...new Set(roomsRaw.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 5))].sort(),
    sort: sort in SORTS ? sort : 'new',
    page,
    view: one(sp.view) === 'map' ? 'map' : 'list',
    fmin: numOrNull(one(sp.fmin)),
    fmax: numOrNull(one(sp.fmax)),
    notFirst: one(sp.nf) === '1',
    notLast: one(sp.nl) === '1',
    ymin: numOrNull(one(sp.ymin)),
    ymax: numOrNull(one(sp.ymax)),
    plmin: numOrNull(one(sp.plmin)),
    plmax: numOrNull(one(sp.plmax)),
    umin: numOrNull(one(sp.umin)),
    umax: numOrNull(one(sp.umax)),
    building: list(sp.bld, BUILDINGS),
    heating: list(sp.heat, HEATING),
    finish: list(sp.fin, FINISHES),
    energy: ENERGY.includes(one(sp.en)) ? one(sp.en) : '',
    purpose: one(sp.purpose).slice(0, 40),
    features: list(sp.feat, [...new Set(Object.values(FEATURES).flat())]),
    days: DAYS.includes(Number(one(sp.days))) ? Number(one(sp.days)) : null,
    photos: one(sp.photos) === '1',
  }
}

/** Filtrų būsena → URL užklausa (numatytosios reikšmės praleidžiamos). */
export function toQuery(f: Partial<Filters>) {
  const p = new URLSearchParams()
  if (f.deal === 'rent') p.set('deal', 'rent')
  if (f.type && f.type !== 'all') p.set('type', f.type)
  if (f.city) p.set('city', f.city)
  if (f.city && f.districts?.length) p.set('district', f.districts.join(','))
  if (f.q) p.set('q', f.q)
  if (f.pmin != null) p.set('pmin', String(f.pmin))
  if (f.pmax != null) p.set('pmax', String(f.pmax))
  if (f.amin != null) p.set('amin', String(f.amin))
  if (f.amax != null) p.set('amax', String(f.amax))
  if (f.rooms?.length && roomsApply(f.type ?? 'all')) p.set('rooms', f.rooms.join(','))
  const t = f.type ?? 'all'
  const num = (k: string, v: number | null | undefined) => { if (v != null) p.set(k, String(v)) }
  if (advApplies('floor', t)) { num('fmin', f.fmin); num('fmax', f.fmax); if (f.notFirst) p.set('nf', '1'); if (f.notLast) p.set('nl', '1') }
  if (advApplies('year', t)) { num('ymin', f.ymin); num('ymax', f.ymax) }
  if (advApplies('plot', t)) { num('plmin', f.plmin); num('plmax', f.plmax) }
  num('umin', f.umin); num('umax', f.umax)
  if (advApplies('building', t) && f.building?.length) p.set('bld', f.building.join(','))
  if (advApplies('heating', t) && f.heating?.length) p.set('heat', f.heating.join(','))
  if (advApplies('finish', t) && f.finish?.length) p.set('fin', f.finish.join(','))
  if (advApplies('energy', t) && f.energy) p.set('en', f.energy)
  if (advApplies('purpose', t) && f.purpose) p.set('purpose', f.purpose)
  if (f.features?.length) p.set('feat', f.features.join(','))
  num('days', f.days)
  if (f.photos) p.set('photos', '1')
  if (f.view === 'map') p.set('view', 'map')
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

// ---------------------------------------------------------------------------
// Prenumeratos: išsaugota paieška
// ---------------------------------------------------------------------------

/** Paieškos adresas be rodymo nustatymų (puslapio, rikiavimo, žemėlapio) – pagal jį atpažįstama ta pati paieška. */
export const searchQueryOf = (f: Filters) => toQuery({ ...f, page: 1, sort: 'new', view: 'list' })

/** Filtrai duomenų bazės funkcijai search_matches (supabase/migrations/0006). Taikomi tik kategorijai tinkantys. */
export function criteriaOf(f: Filters) {
  const t = f.type
  const c: Record<string, unknown> = { deal: f.deal }
  const num = (k: keyof Filters) => { if (f[k] != null) c[k] = f[k] }
  if (t !== 'all') c.type = t
  if (f.city) {
    c.city = f.city
    if (f.districts.length) c.districts = f.districts
  }
  ;(['pmin', 'pmax', 'amin', 'amax', 'umin', 'umax'] as const).forEach(num)
  if (f.rooms.length && roomsApply(t)) c.rooms = f.rooms
  const words = searchWords(f.q)
  if (words.length) c.words = words
  if (advApplies('floor', t)) {
    num('fmin'); num('fmax')
    if (f.notFirst) c.notFirst = true
    if (f.notLast) c.notLast = true
  }
  if (advApplies('year', t)) { num('ymin'); num('ymax') }
  if (advApplies('plot', t)) { num('plmin'); num('plmax') }
  for (const k of ['building', 'heating', 'finish'] as const) if (advApplies(k, t) && f[k].length) c[k] = f[k]
  if (advApplies('energy', t) && f.energy) c.energy = f.energy
  if (advApplies('purpose', t) && f.purpose) c.purpose = f.purpose
  if (f.features.length) c.features = f.features
  if (f.photos) c.photos = true
  return c
}

/** Trumpas paieškos aprašymas: „Butai pardavimui · Vilnius · Žirmūnai · iki 200 000 € · +2 filtrai“. */
export function describeFilters(f: Filters) {
  const parts = [`${f.type === 'all' ? 'Visi skelbimai' : TYPES[f.type].many} ${f.deal === 'rent' ? 'nuomai' : 'pardavimui'}`]
  if (f.city) parts.push(f.city)
  if (f.city && f.districts.length) parts.push(f.districts.join(', '))
  const unitP = f.deal === 'rent' ? '€/mėn.' : '€', unitA = f.type === 'sklypas' ? 'a' : 'm²'
  const range = (a: number | null, b: number | null, u: string) =>
    a != null && b != null ? `${fmt(a)}–${fmt(b)} ${u}` : a != null ? `nuo ${fmt(a)} ${u}` : `iki ${fmt(b!)} ${u}`
  if (f.pmin != null || f.pmax != null) parts.push(range(f.pmin, f.pmax, unitP))
  if (f.amin != null || f.amax != null) parts.push(range(f.amin, f.amax, unitA))
  if (f.rooms.length && roomsApply(f.type)) parts.push(`${f.rooms.map((r) => (r === 5 ? '5+' : r)).join(', ')} kamb.`)
  if (f.q) parts.push(`„${f.q}“`)
  const n = advancedCount(f)
  if (n) parts.push(`+${n} ${n === 1 ? 'filtras' : n < 10 ? 'filtrai' : 'filtrų'}`)
  return parts.join(' · ').slice(0, 300)
}
