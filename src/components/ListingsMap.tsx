'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import Supercluster from 'supercluster'
import { googleMapsUrl, shortPrice } from '@/lib/geo'
import { loadMapLibre, mapOptions } from '@/lib/map'

export type MapPoint = {
  id: number
  lat: number
  lng: number
  deal: 'sale' | 'rent'
  price: number
  title: string
  addr: string
  photo: string | null
}

/** Iššokantis langelis kuriamas iš DOM elementų (textContent), todėl skelbėjų tekstas negali įterpti HTML. */
function popupContent(p: MapPoint) {
  const box = document.createElement('div')
  box.className = 'mpop'
  const a = document.createElement('a')
  a.className = 'mpop-main'
  a.href = `/skelbimas/${p.id}`
  if (p.photo) {
    const img = document.createElement('img')
    img.src = p.photo
    img.alt = ''
    a.append(img)
  }
  const body = document.createElement('div')
  const price = document.createElement('b')
  price.textContent = shortPrice(p.price, p.deal)
  const title = document.createElement('span')
  title.textContent = p.title
  const addr = document.createElement('small')
  addr.textContent = p.addr
  body.append(price, title, addr)
  a.append(body)
  const g = document.createElement('a')
  g.className = 'mpop-gmaps'
  g.href = googleMapsUrl(p.lat, p.lng)
  g.target = '_blank'
  g.rel = 'noopener noreferrer'
  g.textContent = 'Atidaryti Google Maps ↗'
  box.append(a, g)
  return box
}

export function ListingsMap({ points }: { points: MapPoint[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let cleanup = () => {}
    loadMapLibre().then((ml) => {
      if (cancelled || !ref.current) return
      let map: InstanceType<typeof ml.Map>
      try {
        map = new ml.Map(mapOptions(ref.current))
      } catch {
        return setFailed(true)
      }
      map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right')

      const index = new Supercluster<MapPoint>({ radius: 56, maxZoom: 17 }).load(
        points.map((p) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] }, properties: p })),
      )
      const popup = new ml.Popup({ offset: 18, maxWidth: '280px', closeButton: true })
      let markers: InstanceType<typeof ml.Marker>[] = []
      let active = -1

      const render = () => {
        markers.forEach((m) => m.remove())
        markers = []
        const b = map.getBounds()
        const items = index.getClusters([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], Math.floor(map.getZoom()))
        for (const f of items) {
          const [lng, lat] = f.geometry.coordinates
          const el = document.createElement('button')
          el.type = 'button'
          if ('cluster' in f.properties && f.properties.cluster) {
            const n = f.properties.point_count
            el.className = 'mk-cluster'
            el.textContent = String(n)
            el.style.setProperty('--s', `${Math.min(64, 34 + Math.log2(n) * 6)}px`)
            el.setAttribute('aria-label', `${n} skelbimai šioje vietoje, priartinti`)
            const id = f.properties.cluster_id
            el.onclick = () => map.easeTo({ center: [lng, lat], zoom: Math.min(index.getClusterExpansionZoom(id), 17) })
          } else {
            const p = f.properties as MapPoint
            el.className = p.id === active ? 'mk-price on' : 'mk-price'
            el.textContent = shortPrice(p.price, p.deal)
            el.setAttribute('aria-label', `${shortPrice(p.price, p.deal)}, ${p.title}, ${p.addr}`)
            el.onclick = (e) => {
              e.stopPropagation()
              active = p.id
              markers.forEach((m) => m.getElement().classList.remove('on'))
              el.classList.add('on')
              popup.setLngLat([lng, lat]).setDOMContent(popupContent(p)).addTo(map)
            }
          }
          markers.push(new ml.Marker({ element: el }).setLngLat([lng, lat]).addTo(map))
        }
      }
      popup.on('close', () => {
        active = -1
        markers.forEach((m) => m.getElement().classList.remove('on'))
      })

      if (points.length === 1) map.jumpTo({ center: [points[0].lng, points[0].lat], zoom: 14 })
      else if (points.length > 1) {
        const lngs = points.map((p) => p.lng), lats = points.map((p) => p.lat)
        map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, maxZoom: 14, animate: false })
      }
      map.on('moveend', render)
      render()
      cleanup = () => map.remove()
    }).catch(() => setFailed(true))
    return () => {
      cancelled = true
      cleanup()
    }
  }, [points])

  if (failed) return <div className="lmap lmap-failed">Žemėlapio nepavyko įkelti. Atnaujinkite puslapį arba peržiūrėkite skelbimus sąraše.</div>
  return <div className="lmap" ref={ref} role="region" aria-label="Skelbimai žemėlapyje" />
}
