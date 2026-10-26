// Sugeneruoja public/streets/<miestas>.json iš OpenStreetMap adresų (addr:city + addr:street).
// Paleidimas: node --experimental-strip-types scripts/build-streets.mts streets.tsv
// streets.tsv eilutės: miestas \t savivaldybė \t gatvė \t adresų skaičius (žr. .github/workflows/streets.yml).
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { ALL_CITIES, DISTRICT_MUNICIPALITIES, citySlug } from '../src/lib/locations.ts'

const byPlace = new Map<string, Set<string>>()
for (const line of readFileSync(process.argv[2] ?? 'streets.tsv', 'utf8').split('\n')) {
  const [place, , raw] = line.split('\t')
  const street = (raw ?? '').replace(/\s+/g, ' ').trim()
  if (!place || street.length < 3 || !/\p{L}{2}/u.test(street)) continue
  if (!byPlace.has(place)) byPlace.set(place, new Set())
  byPlace.get(place)!.add(street)
}
const coll = new Intl.Collator('lt')
const streetsOf = (place: string) => [...(byPlace.get(place) ?? [])].sort(coll.compare)

rmSync('public/streets', { recursive: true, force: true })
mkdirSync('public/streets', { recursive: true })
let files = 0, total = 0
for (const city of ALL_CITIES) {
  const districts = DISTRICT_MUNICIPALITIES[city]
  // Rajonuose gatvės priklauso gyvenvietei, miestuose – visam miestui.
  const data: Record<string, string[]> = districts
    ? Object.fromEntries(districts.map((d) => [d, streetsOf(d)]))
    : { '*': streetsOf(city) }
  const n = Object.values(data).reduce((a, l) => a + l.length, 0)
  if (!n) continue
  writeFileSync(`public/streets/${citySlug(city)}.json`, JSON.stringify(data))
  files++; total += n
}
console.log(`public/streets: ${files} failų, ${total} gatvių`)
