// Tik serverio kodui: adresų paieška vyksta serverio veiksmuose.
import { inLithuania } from '@/lib/geo'
import { SITE } from '@/lib/site'

type Point = { lat: number; lng: number }
const UA = `${SITE.name} (+${SITE.url})`

async function nominatim(q: string): Promise<Point | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=lt&limit=1&accept-language=lt&q=${encodeURIComponent(q)}`
  const r = await fetch(url, { headers: { 'User-Agent': UA, Referer: SITE.url }, signal: AbortSignal.timeout(4000), next: { revalidate: 86400 } })
  if (!r.ok) throw new Error(`nominatim ${r.status}`)
  const [hit] = (await r.json()) as { lat: string; lon: string }[]
  return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null
}

// Atsarginė paieška, jei Nominatim riboja užklausas (Photon taip pat naudoja OpenStreetMap duomenis).
async function photon(q: string): Promise<Point | null> {
  const url = `https://photon.komoot.io/api/?limit=1&lat=55.17&lon=23.9&q=${encodeURIComponent(q)}`
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(4000), next: { revalidate: 86400 } })
  if (!r.ok) return null
  const f = ((await r.json()) as { features?: { geometry: { coordinates: [number, number] }; properties: { countrycode?: string } }[] }).features?.[0]
  return f && f.properties.countrycode === 'LT' ? { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] } : null
}

async function find(q: string) {
  let p: Point | null = null
  try {
    p = await nominatim(q)
  } catch {
    p = await photon(q).catch(() => null)
  }
  return p && inLithuania(p.lat, p.lng) ? { lat: Math.round(p.lat * 1e6) / 1e6, lng: Math.round(p.lng * 1e6) / 1e6 } : null
}

/**
 * Apytikslė vieta pagal adresą: pirma su gatve, nepavykus – mikrorajonas ar gyvenvietė, galiausiai miestas.
 * Rajonų savivaldybėse (pvz. „Vilniaus r.“) gyvenvietė yra mikrorajono laukelyje.
 */
export async function geocodeAddress(city: string, district: string, street: string): Promise<Point | null> {
  const rajonas = city.endsWith(' r.')
  const place = rajonas ? district : city
  const area = rajonas ? `${city.replace(/ r\.$/, ' rajono savivaldybė')}` : district
  const street1 = street.trim()
  const tries = [
    street1 && `${street1}, ${place}`,
    district && `${district}, ${rajonas ? area : city}`,
    rajonas ? area : city,
  ].filter(Boolean) as string[]
  for (const q of [...new Set(tries)]) {
    const p = await find(q).catch(() => null)
    if (p) return p
  }
  return null
}
