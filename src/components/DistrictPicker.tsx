'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/icons'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function districtWord(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'mikrorajonas'
  if (n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20)) return 'mikrorajonai'
  return 'mikrorajonų'
}

type Props = {
  options: string[]
  value: string[]
  disabled?: boolean
  labelledBy: string
  onChange: (value: string[]) => void
}

/** Kelių mikrorajonų pasirinkimas: mygtukas atidaro sąrašą su varnelėmis ir paieška. */
export function DistrictPicker({ options, value, disabled, labelledBy, onChange }: Props) {
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  // Iš nuorodos atėję mikrorajonai, kurių nėra sąraše, vis tiek rodomi.
  const all = useMemo(() => [...new Set([...options, ...value])].sort((a, b) => a.localeCompare(b, 'lt')), [options, value])
  const shown = useMemo(() => all.filter((d) => norm(d).includes(norm(q.trim()))), [all, q])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      ref.current?.querySelector<HTMLButtonElement>('.dp-btn')?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = (d: string) => onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d])
  const summary = disabled
    ? 'Pirma pasirinkite miestą'
    : value.length === 0 ? 'Visi mikrorajonai'
    : value.length <= 2 ? value.join(', ')
    : `${value.length} ${districtWord(value.length)}`

  return (
    <div className="dpick" ref={ref}>
      <button type="button" className="dp-btn" disabled={disabled} aria-expanded={open} aria-controls={`${id}-panel`}
        aria-labelledby={`${labelledBy} ${id}-sum`} onClick={() => { setOpen(!open); setQ('') }}>
        <span id={`${id}-sum`} className={value.length ? undefined : 'dp-muted'}>{summary}</span>
        <Icon name="chevron" />
      </button>
      {open && (
        <div className="dp-panel" id={`${id}-panel`} role="group" aria-labelledby={labelledBy}>
          {all.length > 8 && (
            <input type="search" className="dp-search" placeholder="Ieškoti mikrorajono" aria-label="Ieškoti mikrorajono"
              value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          )}
          <div className="dp-list">
            {shown.map((d) => (
              <label key={d}>
                <input type="checkbox" checked={value.includes(d)} onChange={() => toggle(d)} />
                <span>{d}</span>
              </label>
            ))}
            {shown.length === 0 && <p className="hint">Tokio mikrorajono nėra.</p>}
          </div>
          <div className="dp-foot">
            <button type="button" className="link-btn" disabled={!value.length} onClick={() => onChange([])}>Išvalyti</button>
            <button type="button" className="btn btn-cta" onClick={() => setOpen(false)}>
              {value.length ? `Pasirinkta: ${value.length}` : 'Uždaryti'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
