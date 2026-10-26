'use client'

import { useEffect, useId, useMemo, useState, type InputHTMLAttributes } from 'react'
import { citySlug } from '@/lib/locations'

type StreetsFile = Record<string, string[]>

// Kiekvieno miesto gatvių sąrašas (public/streets/<miestas>.json) parsiunčiamas tik vieną kartą.
const cache = new Map<string, Promise<StreetsFile | null>>()
function loadStreets(city: string) {
  const slug = citySlug(city)
  if (!cache.has(slug)) {
    cache.set(slug, fetch(`/streets/${slug}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null))
  }
  return cache.get(slug)!
}

// Lietuviškos raidės NFD formoje lieka vienos raidės ilgio, todėl pozicijos sutampa su originalu.
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

type Props = {
  city: string
  district?: string
  value: string
  onChange: (value: string) => void
  onPick?: (street: string) => void
  inputProps?: InputHTMLAttributes<HTMLInputElement>
}

export function StreetInput({ city, district = '', value, onChange, onPick, inputProps }: Props) {
  const id = useId()
  const [streets, setStreets] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  useEffect(() => {
    let alive = true
    setStreets([])
    if (!city) return
    loadStreets(city).then((data) => {
      if (!alive || !data) return
      const list = data[district] ?? data['*'] ?? [...new Set(Object.values(data).flat())]
      setStreets(list)
    })
    return () => { alive = false }
  }, [city, district])

  const q = norm(value.trim())
  const matches = useMemo(() => {
    if (q.length < 2) return []
    const starts: string[] = [], words: string[] = [], inside: string[] = []
    for (const s of streets) {
      const n = norm(s)
      if (n.startsWith(q)) starts.push(s)
      else if (n.split(/[\s.-]+/).some((w) => w.startsWith(q))) words.push(s)
      else if (n.includes(q)) inside.push(s)
    }
    return [...starts, ...words, ...inside].slice(0, 8)
  }, [q, streets])
  const show = open && matches.length > 0 && !(matches.length === 1 && matches[0] === value)

  function pick(s: string) {
    onChange(s)
    onPick?.(s)
    setOpen(false)
    setActive(-1)
  }
  function mark(s: string) {
    const i = norm(s).indexOf(q)
    if (i < 0) return s
    return <>{s.slice(0, i)}<mark>{s.slice(i, i + q.length)}</mark>{s.slice(i + q.length)}</>
  }

  return (
    <div className="combo">
      <input
        {...inputProps}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={`${id}-list`}
        aria-activedescendant={show && active >= 0 ? `${id}-${active}` : undefined}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!show) return
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % matches.length) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a <= 0 ? matches.length - 1 : a - 1)) }
          else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(matches[active]) }
          else if (e.key === 'Escape') setOpen(false)
        }}
      />
      {show && (
        <ul className="combo-list" role="listbox" id={`${id}-list`}>
          {matches.map((s, i) => (
            <li key={s} id={`${id}-${i}`} role="option" aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(s) }}
              onMouseEnter={() => setActive(i)}>
              {mark(s)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
