import type { ListingInput } from '@/lib/validate'

type Row = Record<string, unknown>

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v))

/** Duomenų bazės eilutė → formos reikšmės. */
export function rowToInput(r: Row): ListingInput {
  return {
    deal: r.deal === 'rent' ? 'rent' : 'sale',
    type: (r.type as ListingInput['type']) ?? 'butas',
    city: str(r.city), district: str(r.district), street: str(r.street),
    price: str(r.price), area: str(r.area), rooms: str(r.rooms), floor: str(r.floor), floors: str(r.floors),
    plot: str(r.plot), year: str(r.year), building: str(r.building), heating: str(r.heating), finish: str(r.finish),
    energy: str(r.energy), purpose: str(r.purpose), features: Array.isArray(r.features) ? (r.features as string[]) : [],
    description: str(r.description), contact_name: str(r.contact_name), contact_phone: str(r.contact_phone),
    lat: str(r.lat), lng: str(r.lng),
  }
}

export function emptyInput(contactName: string, contactPhone: string): ListingInput {
  return rowToInput({ deal: 'sale', type: 'butas', contact_name: contactName, contact_phone: contactPhone })
}
