import {
  BUILDINGS, ENERGY, FEATURES, FINISHES, HEATING, PURPOSES, TYPE_KEYS, fieldApplies,
  type Deal, type ListingType,
} from '@/lib/listings'
import { inLithuania } from '@/lib/geo'

/** Formos reikšmės (tekstas, kaip įvesta), siunčiamos į serverio veiksmą. */
export type ListingInput = {
  deal: Deal
  type: ListingType
  city: string
  district: string
  street: string
  price: string
  area: string
  rooms: string
  floor: string
  floors: string
  plot: string
  year: string
  building: string
  heating: string
  finish: string
  energy: string
  purpose: string
  features: string[]
  description: string
  contact_name: string
  contact_phone: string
  /** Vieta žemėlapyje; tuščia – nustatoma pagal adresą. */
  lat: string
  lng: string
}

export type ListingRow = {
  deal: Deal
  type: ListingType
  city: string
  district: string
  street: string
  price: number
  area: number
  rooms: number | null
  floor: number | null
  floors: number | null
  plot: number | null
  year: number | null
  building: string | null
  heating: string | null
  finish: string | null
  energy: string | null
  purpose: string | null
  features: string[]
  description: string
  contact_name: string
  contact_phone: string
  lat: number | null
  lng: number | null
}

export const PHONE_RE = /^\+?[0-9 ()-]{8,20}$/

const num = (v: string) => {
  const s = String(v ?? '').trim().replace(/\s/g, '').replace(',', '.')
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}
const text = (v: string, max: number) => String(v ?? '').trim().slice(0, max)

export function validateListing(v: ListingInput): { row: ListingRow | null; errors: Record<string, string> } {
  const e: Record<string, string> = {}
  const type = TYPE_KEYS.includes(v.type) ? v.type : null
  if (!type) e.type = 'Pasirinkite kategoriją.'
  const deal: Deal = v.deal === 'rent' ? 'rent' : 'sale'
  const t = type ?? 'butas'

  const city = text(v.city, 80), district = text(v.district, 80), street = text(v.street, 120)
  if (!city) e.city = 'Įrašykite miestą ar savivaldybę.'
  if (!district) e.district = 'Įrašykite mikrorajoną ar gyvenvietę.'
  if (!street) e.street = 'Įrašykite gatvę.'

  const price = num(v.price)
  if (price === null || Number.isNaN(price) || price <= 0) e.price = 'Įrašykite kainą eurais.'
  else if (price >= 100_000_000) e.price = 'Kaina per didelė.'

  const area = num(v.area)
  if (area === null || Number.isNaN(area) || area <= 0) e.area = t === 'sklypas' ? 'Įrašykite sklypo plotą arais.' : 'Įrašykite plotą kvadratiniais metrais.'

  const optInt = (key: 'rooms' | 'floor' | 'floors' | 'year', min: number, max: number, msg: string) => {
    if (!fieldApplies(key, t)) return null
    const n = num(v[key])
    if (n === null) return null
    if (Number.isNaN(n) || !Number.isInteger(n) || n < min || n > max) { e[key] = msg; return null }
    return n
  }
  const thisYear = new Date().getFullYear()
  const rooms = optInt('rooms', 1, 50, 'Kambarių skaičius turi būti nuo 1 iki 50.')
  if (fieldApplies('rooms', t) && rooms === null && !e.rooms) e.rooms = 'Nurodykite kambarių skaičių.'
  const floor = optInt('floor', -5, 200, 'Netinkamas aukštas.')
  const floors = optInt('floors', 1, 200, 'Netinkamas aukštų skaičius.')
  if (floor !== null && floors !== null && floor > floors) e.floor = 'Aukštas negali būti didesnis už aukštų skaičių.'
  const year = optInt('year', 1500, thisYear + 5, `Statybos metai turi būti nuo 1500 iki ${thisYear + 5}.`)

  let plot: number | null = null
  if (fieldApplies('plot', t)) {
    const n = num(v.plot)
    if (n !== null && (Number.isNaN(n) || n <= 0)) e.plot = 'Netinkamas sklypo plotas.'
    else plot = n
  }

  const pickFrom = (key: 'building' | 'heating' | 'finish' | 'energy', list: string[]) =>
    fieldApplies(key, t) && list.includes(v[key]) ? v[key] : null
  const purposes = PURPOSES[t] ?? []
  const purpose = fieldApplies('purpose', t) && purposes.includes(v.purpose) ? v.purpose : null
  if (fieldApplies('purpose', t) && !purpose) e.purpose = 'Pasirinkite paskirtį.'

  const allowed = FEATURES[t]
  const features = [...new Set((v.features ?? []).filter((f) => allowed.includes(f)))].slice(0, 20)

  const description = text(v.description, 5000)
  const contact_name = text(v.contact_name, 80)
  const contact_phone = text(v.contact_phone, 20)
  if (!contact_name) e.contact_name = 'Įrašykite vardą, kurį matys pirkėjai.'
  if (!PHONE_RE.test(contact_phone)) e.contact_phone = 'Įrašykite telefono numerį, pvz. +370 612 34567.'

  let lat = num(v.lat), lng = num(v.lng)
  if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) lat = lng = null
  else if (!inLithuania(lat, lng)) e.location = 'Pažymėta vieta turi būti Lietuvoje.'

  if (Object.keys(e).length) return { row: null, errors: e }
  return {
    errors: {},
    row: {
      deal, type: t, city, district, street,
      price: price!, area: area!, rooms, floor, floors, plot, year,
      building: pickFrom('building', BUILDINGS),
      heating: pickFrom('heating', HEATING),
      finish: pickFrom('finish', FINISHES),
      energy: pickFrom('energy', ENERGY),
      purpose, features, description, contact_name, contact_phone, lat, lng,
    },
  }
}
