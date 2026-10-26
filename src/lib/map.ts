// MapLibre žemėlapis (tik naršyklėje). Pagrindas – OpenFreeMap (OpenStreetMap duomenys, nemokamas ir be raktų).
// Vietiniams bandymams stilių galima pakeisti NEXT_PUBLIC_MAP_STYLE.
import maplibrePkg from 'maplibre-gl/package.json'
import { LT_CENTER } from '@/lib/geo'

export const MAP_STYLE = process.env.NEXT_PUBLIC_MAP_STYLE || 'https://tiles.openfreemap.org/styles/positron'

const LOCALE = {
  'NavigationControl.ZoomIn': 'Priartinti',
  'NavigationControl.ZoomOut': 'Nutolinti',
  'NavigationControl.ResetBearing': 'Atstatyti kryptį',
  'AttributionControl.ToggleAttribution': 'Rodyti šaltinius',
  'Popup.Close': 'Uždaryti',
  'CooperativeGesturesHandler.WindowsHelpText': 'Norėdami keisti mastelį, laikykite Ctrl ir sukite pelės ratuką',
  'CooperativeGesturesHandler.MacHelpText': 'Norėdami keisti mastelį, laikykite ⌘ ir sukite pelės ratuką',
  'CooperativeGesturesHandler.MobileHelpText': 'Žemėlapį judinkite dviem pirštais',
}

/**
 * MapLibre įkeliamas tik kai žemėlapis rodomas, kaip atskiras modulis iš public/vendor
 * (ten jį prieš build nukopijuoja scripts/copy-maplibre.mjs). Taip jis pats randa savo „worker“ failą.
 */
export function loadMapLibre() {
  const url = `/vendor/maplibre-gl-${maplibrePkg.version}/maplibre-gl.mjs`
  return import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url) as Promise<typeof import('maplibre-gl')>
}
export type MapLibre = Awaited<ReturnType<typeof loadMapLibre>>

export const mapOptions = (container: HTMLElement) => ({
  container,
  style: MAP_STYLE,
  center: LT_CENTER,
  zoom: 6.2,
  locale: LOCALE,
  attributionControl: { compact: true } as const,
  cooperativeGestures: true,
})
