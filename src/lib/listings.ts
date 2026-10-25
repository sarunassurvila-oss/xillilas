import { PHOTO_BUCKET, SUPABASE_URL } from '@/lib/env'

export type Deal = 'sale' | 'rent'
export type ListingType = 'butas' | 'namas' | 'sklypas' | 'patalpos' | 'garazas'
export type Status = 'draft' | 'active' | 'paused' | 'closed'
export type EffectiveStatus = Status | 'expired'

export type Photo = { id?: number; path: string; position: number }

export type Listing = {
  id: number
  owner_id?: string
  status: Status
  deal: Deal
  type: ListingType
  city: string
  district: string
  street: string
  price: number
  old_price: number | null
  area: number
  rooms: number | null
  floor: number | null
  floors: number | null
  plot: number | null
  year: number | null
  building: string | null
  heating?: string | null
  finish?: string | null
  energy: string | null
  purpose: string | null
  features: string[]
  description?: string
  contact_name?: string
  published_at: string | null
  expires_at?: string | null
  created_at?: string
  updated_at?: string
  listing_photos?: Photo[]
}

export const TYPES: Record<ListingType, { one: string; many: string }> = {
  butas: { one: 'Butas', many: 'Butai' },
  namas: { one: 'Namas', many: 'Namai' },
  sklypas: { one: 'Sklypas', many: 'Sklypai' },
  patalpos: { one: 'Patalpos', many: 'Patalpos' },
  garazas: { one: 'Garažas', many: 'Garažai' },
}
export const TYPE_KEYS = Object.keys(TYPES) as ListingType[]

export const BUILDINGS = ['Mūrinis', 'Blokinis', 'Monolitinis', 'Medinis', 'Karkasinis', 'Rąstinis', 'Kita']
export const HEATING = ['Centrinis', 'Centrinis kolektorinis', 'Dujinis', 'Elektra', 'Geoterminis', 'Šilumos siurblys', 'Kietu kuru', 'Kita']
export const FINISHES = ['Įrengtas', 'Dalinė apdaila', 'Neįrengtas', 'Reikia remonto']
export const ENERGY = ['A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G']
export const PURPOSES: Partial<Record<ListingType, string[]>> = {
  sklypas: ['Namų valdos', 'Sodo', 'Rekreacinis', 'Žemės ūkio', 'Komercinis'],
  patalpos: ['Biuro', 'Prekybos', 'Sandėliavimo', 'Gamybos', 'Maitinimo'],
}
export const FEATURES: Record<ListingType, string[]> = {
  butas: ['Balkonas', 'Terasa', 'Vieta automobiliui', 'Požeminė aikštelė', 'Liftas', 'Sandėliukas', 'Rūsys', 'Su baldais', 'Renovuotas namas', 'Galima su gyvūnais', 'Aukštos lubos', 'Rekuperacija'],
  namas: ['Garažas', 'Terasa', 'Sodas', 'Pirtis', 'Rūsys', 'Rekuperacija', 'Saulės elektrinė', 'Prie ežero', 'Prie miško', 'Su baldais', 'Galima su gyvūnais', 'Aptverta teritorija'],
  sklypas: ['Elektra', 'Vandentiekis', 'Kanalizacija', 'Dujos', 'Asfaltuotas privažiavimas', 'Prie ežero', 'Prie miško', 'Topografinė nuotrauka'],
  patalpos: ['Atskiras įėjimas', 'Vitrininiai langai', 'Liftas', 'Vieta automobiliui', 'Atviras planas', 'Kondicionavimas', 'Apsauga'],
  garazas: ['Elektra', 'Apžiūros duobė', 'Rūsys', 'Apsauga', 'Automatiniai vartai'],
}

/** Kuriems objekto tipams rodomas kiekvienas laukas. */
export const FIELD_TYPES = {
  rooms: ['butas', 'namas'],
  floor: ['butas', 'patalpos'],
  floors: ['butas', 'namas', 'patalpos'],
  plot: ['namas'],
  year: ['butas', 'namas', 'patalpos', 'garazas'],
  building: ['butas', 'namas', 'patalpos', 'garazas'],
  heating: ['butas', 'namas', 'patalpos'],
  finish: ['butas', 'namas', 'patalpos'],
  energy: ['butas', 'namas', 'patalpos'],
  purpose: ['sklypas', 'patalpos'],
} satisfies Record<string, ListingType[]>
export const fieldApplies = (field: keyof typeof FIELD_TYPES, type: ListingType) =>
  (FIELD_TYPES[field] as ListingType[]).includes(type)

/* ---------- formatavimas ---------- */
const NF = new Intl.NumberFormat('lt-LT', { maximumFractionDigits: 0 })
const NF1 = new Intl.NumberFormat('lt-LT', { maximumFractionDigits: 1 })
export const fmt = (n: number) => NF.format(Math.round(n))
export const fmt1 = (n: number) => NF1.format(n)

const FLOORS_WORD: Record<number, string> = { 1: 'Vieno aukšto', 2: 'Dviejų aukštų', 3: 'Trijų aukštų' }

export function titleOf(l: Pick<Listing, 'type' | 'rooms' | 'floors' | 'purpose'>) {
  switch (l.type) {
    case 'butas': return l.rooms ? `${l.rooms} kamb. butas` : 'Butas'
    case 'namas': return `${(l.floors && FLOORS_WORD[l.floors]) || 'Gyvenamasis'} namas`
    case 'sklypas': return `${l.purpose || 'Namų valdos'} sklypas`
    case 'patalpos': return `${l.purpose || 'Komercinės'} patalpos`
    default: return 'Garažas'
  }
}
export const sizeOf = (l: Pick<Listing, 'type' | 'area'>) => (l.type === 'sklypas' ? `${fmt1(l.area)} a` : `${fmt1(l.area)} m²`)
export const fullTitle = (l: Listing) => `${titleOf(l)}, ${sizeOf(l)}`
export const addrOf = (l: Pick<Listing, 'city' | 'district' | 'street'>) => [l.city, l.district, l.street].filter(Boolean).join(', ')
export const priceLabel = (l: Pick<Listing, 'deal' | 'price'>) => (l.deal === 'rent' ? `${fmt(l.price)} €/mėn.` : `${fmt(l.price)} €`)

export function unitLabel(l: Pick<Listing, 'deal' | 'type' | 'price' | 'area'>) {
  if (!l.area) return ''
  if (l.deal === 'rent') return l.type === 'garazas' ? '' : `${fmt1(l.price / l.area)} €/m² per mėn.`
  return l.type === 'sklypas' ? `${fmt(l.price / l.area)} €/a` : `${fmt(l.price / l.area)} €/m²`
}

export function specsOf(l: Listing) {
  const s: string[] = []
  if (l.rooms) s.push(`${l.rooms} kamb.`)
  s.push(sizeOf(l))
  if (l.floor) s.push(l.floors ? `${l.floor}/${l.floors} a.` : `${l.floor} a.`)
  if (l.type === 'namas' && l.plot) s.push(`sklypas ${fmt1(l.plot)} a`)
  if (l.type === 'sklypas' && l.features[0]) s.push(l.features[0])
  if (l.year && l.type !== 'garazas') s.push(`${l.year} m.`)
  if (l.type === 'garazas' && l.building) s.push(l.building)
  return s
}

export function daysSince(iso: string | null | undefined) {
  if (!iso) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 864e5))
}
export const daysLabel = (d: number) => (d <= 0 ? 'Šiandien' : d === 1 ? 'Vakar' : `Prieš ${d} d.`)

export function nomWord(n: number) {
  const a = n % 10, b = n % 100
  return a === 1 && b !== 11 ? 'skelbimas' : a >= 2 && (b < 11 || b > 19) ? 'skelbimai' : 'skelbimų'
}
export function accWord(n: number) {
  const a = n % 10, b = n % 100
  return a === 1 && b !== 11 ? 'skelbimą' : a >= 2 && (b < 11 || b > 19) ? 'skelbimus' : 'skelbimų'
}
export function dayWord(n: number) {
  const a = n % 10, b = n % 100
  return a === 1 && b !== 11 ? 'diena' : a >= 2 && (b < 11 || b > 19) ? 'dienos' : 'dienų'
}

export const ENERGY_CLASS: Record<string, string> = { 'A++': 'app', 'A+': 'ap', A: 'a', B: 'b', C: 'c', D: 'd', E: 'e', F: 'f', G: 'g' }

export const photoUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`
export const coverOf = (l: Listing) => [...(l.listing_photos ?? [])].sort((a, b) => a.position - b.position)[0]

/* ---------- būsenos ---------- */
export function effectiveStatus(l: Pick<Listing, 'status' | 'expires_at'>): EffectiveStatus {
  if (l.status === 'active' && l.expires_at && new Date(l.expires_at).getTime() <= Date.now()) return 'expired'
  return l.status
}
export function statusLabel(s: EffectiveStatus, deal: Deal) {
  switch (s) {
    case 'draft': return 'Juodraštis'
    case 'active': return 'Aktyvus'
    case 'expired': return 'Pasibaigęs'
    case 'paused': return 'Pristabdytas'
    case 'closed': return deal === 'sale' ? 'Parduotas' : 'Išnuomotas'
  }
}
export function daysLeft(iso: string | null | undefined) {
  if (!iso) return 0
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 864e5))
}
