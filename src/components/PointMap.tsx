'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import { loadMapLibre, mapOptions } from '@/lib/map'

/** Skelbimo vieta jo puslapyje. */
export function PointMap({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let cancelled = false
    let cleanup = () => {}
    loadMapLibre().then((ml) => {
      if (cancelled || !ref.current) return
      try {
        const m = new ml.Map({ ...mapOptions(ref.current), center: [lng, lat], zoom: 14 })
        m.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right')
        new ml.Marker({ color: '#c97d1c' }).setLngLat([lng, lat]).addTo(m)
        cleanup = () => m.remove()
      } catch {
        setFailed(true)
      }
    }).catch(() => setFailed(true))
    return () => {
      cancelled = true
      cleanup()
    }
  }, [lat, lng])
  if (failed) return null
  return <div className="lmap lmap-point" ref={ref} role="region" aria-label="Objekto vieta žemėlapyje" />
}
