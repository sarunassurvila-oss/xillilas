'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Supercluster from 'supercluster'
import { googleMapsUrl, shortPrice } from '@/lib/geo'
import { fmt, nomWord } from '@/lib/listings'
import { loadMapLibre, mapOptions, type MapLibre } from '@/lib/map'

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

type MapT = InstanceType<MapLibre['Map']>
type MarkerT = InstanceType<MapLibre['Marker']>
type Api = { setPoints: (points: MapPoint[], fit: boolean) => void; fitAll: () => void; highlight: (id: number, on: boolean) => void }

/** Kiek kortelių rodyti šalia žemėlapio (daugiau – priartinus). */
const LIST_MAX = 60

function fitTo(map: MapT, points: MapPoint[]) {
  if (points.length === 1) map.jumpTo({ center: [points[0].lng, points[0].lat], zoom: 14 })
  else if (points.length > 1) {
    const lngs = points.map((p) => p.lng), lats = points.map((p) => p.lat)
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, maxZoom: 14, animate: false })
  }
}

/**
 * Paieška žemėlapyje: šalia žemėlapio rodomi tik matomoje jo dalyje esantys skelbimai,
 * sąrašas atsinaujina judinant ar priartinant žemėlapį. Pakeitus filtrus žemėlapis lieka vietoje,
 * o persikelia tik pasikeitus fitKey (miestui, mikrorajonams, kategorijai).
 */
export function ListingsMap({ points, fitKey }: { points: MapPoint[]; fitKey: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLElement>(null)
  const api = useRef<Api | null>(null)
  const latest = useRef({ points, fitKey })
  latest.current = { points, fitKey }
  const shownKey = useRef('')
  const [failed, setFailed] = useState(false)
  const [visible, setVisible] = useState<MapPoint[] | null>(null)
  const [active, setActive] = useState(-1)

  useEffect(() => {
    let cancelled = false
    let cleanup = () => {}
    loadMapLibre().then((ml) => {
      if (cancelled || !ref.current) return
      let map: MapT
      try {
        map = new ml.Map(mapOptions(ref.current))
      } catch {
        return setFailed(true)
      }
      map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right')
      const popup = new ml.Popup({ offset: 18, maxWidth: '280px', closeButton: true })
      let pts: MapPoint[] = []
      let index = new Supercluster<MapPoint>({ radius: 56, maxZoom: 17 })
      let markers: MarkerT[] = []
      const byId = new Map<number, HTMLElement>()
      let activeId = -1

      const render = () => {
        markers.forEach((m) => m.remove())
        markers = []
        byId.clear()
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
            el.className = p.id === activeId ? 'mk-price on' : 'mk-price'
            el.textContent = shortPrice(p.price, p.deal)
            el.setAttribute('aria-label', `${shortPrice(p.price, p.deal)}, ${p.title}, ${p.addr}`)
            el.onclick = (e) => {
              e.stopPropagation()
              activeId = p.id
              byId.forEach((x) => x.classList.remove('on'))
              el.classList.add('on')
              popup.setLngLat([lng, lat]).setDOMContent(popupContent(p)).addTo(map)
              setActive(p.id)
            }
            byId.set(p.id, el)
          }
          markers.push(new ml.Marker({ element: el }).setLngLat([lng, lat]).addTo(map))
        }
        setVisible(pts.filter((p) => b.contains([p.lng, p.lat])))
      }
      popup.on('close', () => {
        activeId = -1
        byId.forEach((x) => x.classList.remove('on'))
        setActive(-1)
      })
      map.on('moveend', render)

      api.current = {
        setPoints(next, fit) {
          pts = next
          index = new Supercluster<MapPoint>({ radius: 56, maxZoom: 17 }).load(
            next.map((p) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] }, properties: p })),
          )
          if (!next.some((p) => p.id === activeId)) popup.remove()
          if (fit) fitTo(map, next)
          render()
        },
        fitAll: () => fitTo(map, pts),
        highlight: (id, on) => byId.get(id)?.classList.toggle('hover', on),
      }
      shownKey.current = latest.current.fitKey
      api.current.setPoints(latest.current.points, true)
      cleanup = () => {
        api.current = null
        map.remove()
      }
    }).catch(() => setFailed(true))
    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  // Nauji rezultatai (pakeisti filtrai): žemėlapis atnaujinamas neperkraunant.
  useEffect(() => {
    if (!api.current) return
    const fit = shownKey.current !== fitKey
    shownKey.current = fitKey
    api.current.setPoints(points, fit)
  }, [points, fitKey])

  // Paspaudus žymę, jos kortelė sąraše parodoma (kai sąrašas šalia žemėlapio).
  useEffect(() => {
    if (active < 0 || !window.matchMedia('(min-width: 961px)').matches) return
    listRef.current?.querySelector(`[data-id="${active}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [active])

  const shown = visible?.slice(0, LIST_MAX) ?? []
  return (
    <div className="mapsplit">
      <div className="mapsplit-map">
        {failed
          ? <div className="lmap lmap-failed">Žemėlapio nepavyko įkelti. Atnaujinkite puslapį arba peržiūrėkite skelbimus sąraše.</div>
          : <div className="lmap" ref={ref} role="region" aria-label="Skelbimai žemėlapyje" />}
      </div>
      <aside className="maplist" ref={listRef} aria-label="Skelbimai matomoje žemėlapio dalyje">
        <p className="maplist-head" aria-live="polite">
          {visible === null
            ? 'Įkeliamas žemėlapis…'
            : visible.length
              ? `Šioje žemėlapio dalyje: ${fmt(visible.length)} ${nomWord(visible.length)}`
              : 'Šioje žemėlapio dalyje skelbimų nėra.'}
          {visible?.length === 0 && points.length > 0 && (
            <button type="button" className="link-btn" onClick={() => api.current?.fitAll()}>Rodyti visus</button>
          )}
        </p>
        {shown.map((p) => (
          <Link key={p.id} href={`/skelbimas/${p.id}`} data-id={p.id} className={p.id === active ? 'mcard on' : 'mcard'}
            onMouseEnter={() => api.current?.highlight(p.id, true)} onMouseLeave={() => api.current?.highlight(p.id, false)}>
            {p.photo ? <img src={p.photo} alt="" loading="lazy" decoding="async" /> : <span className="mcard-noimg" aria-hidden="true" />}
            <span className="mcard-body">
              <b>{shortPrice(p.price, p.deal)}</b>
              <span>{p.title}</span>
              <small>{p.addr}</small>
            </span>
          </Link>
        ))}
        {visible && visible.length > LIST_MAX && (
          <p className="hint">Rodoma {LIST_MAX} iš {fmt(visible.length)}. Priartinkite žemėlapį, kad pamatytumėte kitus.</p>
        )}
      </aside>
    </div>
  )
}
