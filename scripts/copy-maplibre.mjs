// MapLibre kopijuojamas į public/vendor/maplibre-gl-<versija>/ prieš kiekvieną build (žr. src/lib/map.ts).
// Versija kelyje leidžia naršyklėms failus laikyti talpykloje neribotai.
import { copyFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs'

const { version } = JSON.parse(readFileSync('node_modules/maplibre-gl/package.json', 'utf8'))
const dir = `public/vendor/maplibre-gl-${version}`
rmSync('public/vendor', { recursive: true, force: true })
mkdirSync(dir, { recursive: true })
for (const f of ['maplibre-gl.mjs', 'maplibre-gl-worker.mjs']) copyFileSync(`node_modules/maplibre-gl/dist/${f}`, `${dir}/${f}`)
