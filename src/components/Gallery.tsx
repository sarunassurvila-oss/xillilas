'use client'

import { useState } from 'react'
import { Icon } from '@/components/icons'

export function Gallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [i, setI] = useState(0)
  const go = (d: number) => setI((x) => (x + d + photos.length) % photos.length)
  return (
    <div className="gallery" onKeyDown={(e) => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1) }}>
      <div className="g-main">
        <img src={photos[i]} alt={`${alt}, nuotrauka ${i + 1} iš ${photos.length}`} />
        {photos.length > 1 && (
          <>
            <button className="g-nav g-prev" type="button" onClick={() => go(-1)} aria-label="Ankstesnė nuotrauka"><Icon name="left" /></button>
            <button className="g-nav g-next" type="button" onClick={() => go(1)} aria-label="Kita nuotrauka"><Icon name="right" /></button>
            <span className="photo-count">{i + 1} / {photos.length}</span>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="g-thumbs">
          {photos.map((src, k) => (
            <button key={src} type="button" aria-current={k === i ? 'true' : undefined} aria-label={`Nuotrauka ${k + 1}`} onClick={() => setI(k)}>
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
