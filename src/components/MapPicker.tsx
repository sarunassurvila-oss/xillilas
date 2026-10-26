'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import { loadMapLibre, mapOptions, type MapLibre } from '@/lib/map'

type Map = InstanceType<MapLibre['Map']>
type Marker = InstanceType<MapLibre['Marker']>
const valid = (lat: string, lng: string) => lat !== '' && lng !== '' && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))

/** Skelbimo vietos žymėjimas: paspaudus žemėlapį padedama žymė, ją galima pertempti. */
export function MapPicker({ lat, lng, onChange }: { lat: string; lng: string; onChange: (lat: string, lng: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const map = useRef<Map | null>(null)
  const marker = useRef<Marker | null>(null)
  const change = useRef(onChange)
  change.current = onChange
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadMapLibre().then((ml) => {
      if (cancelled || !ref.current) return
      let m: Map
      try {
        m = new ml.Map(mapOptions(ref.current))
      } catch {
        return setFailed(true)
      }
      m.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right')
      const mk = new ml.Marker({ draggable: true, color: '#c97d1c' })
      const emit = (p: { lng: number; lat: number }) => change.current(p.lat.toFixed(6), p.lng.toFixed(6))
      mk.on('dragend', () => emit(mk.getLngLat()))
      m.on('click', (e) => { mk.setLngLat(e.lngLat).addTo(m); emit(e.lngLat) })
      map.current = m
      marker.current = mk
      setReady(true)
    }).catch(() => setFailed(true))
    return () => {
      cancelled = true
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Žymė sekama pagal formos reikšmes (pvz. „Rasti pagal adresą“ arba pašalinus žymę).
  useEffect(() => {
    const m = map.current, mk = marker.current
    if (!ready || !m || !mk) return
    if (!valid(lat, lng)) return void mk.remove()
    const p: [number, number] = [Number(lng), Number(lat)]
    const cur = mk.getLngLat()
    const moved = !cur || Math.abs(cur.lng - p[0]) > 1e-6 || Math.abs(cur.lat - p[1]) > 1e-6 || !mk.getElement().isConnected
    mk.setLngLat(p).addTo(m)
    if (moved && !m.getBounds().contains(p)) m.jumpTo({ center: p, zoom: Math.max(m.getZoom(), 15) })
    else if (moved && m.getZoom() < 12) m.easeTo({ center: p, zoom: 15 })
  }, [ready, lat, lng])

  if (failed) return <p className="hint">Žemėlapio nepavyko įkelti. Vietą nustatysime pagal adresą.</p>
  return <div className="lmap lmap-picker" ref={ref} role="region" aria-label="Pažymėkite vietą žemėlapyje" />
}
