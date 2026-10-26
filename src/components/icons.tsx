const PATHS = {
  all: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  butas: <path d="M5 21V4h14v17M3 21h18M9 8h1.5M13.5 8H15M9 12h1.5M13.5 12H15M9 16h1.5M13.5 16H15" />,
  namas: <path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5.5h4V20" />,
  sklypas: <><path d="M3.5 18.5 7 6l13 3.5-2.5 9z" strokeDasharray="3 2.4" /><path d="M3.5 18.5h0M7 6h0M20 9.5h0M17.5 18.5h0" strokeWidth="3.6" /></>,
  patalpos: <path d="M4 21V3.5h10V21M14 8.5h6V21M2.5 21h19M7 7.5h4M7 11.5h4M7 15.5h4M17 12.5h0M17 16.5h0" />,
  garazas: <path d="M3 21V9.5L12 4l9 5.5V21M7 21v-8h10v8M7 15.5h10M7 18.2h10" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  left: <path d="m15 5-7 7 7 7" />,
  right: <path d="m9 5 7 7-7 7" />,
  trash: <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />,
  star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />,
  camera: <><path d="M4 8h3l2-2.5h6L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  sliders: <path d="M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  list: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h0M4.5 12h0M4.5 18h0" strokeWidth="2.2" />,
  bell: <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0" />,
  map: <path d="m3 6.5 6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5zM9 4v13.5M15 6.5V20" />,
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, className = 'ico' }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  )
}

export function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" style={{ fill: 'var(--brand)' }} />
      <path d="M11 24V13a5 5 0 0 1 10 0v11" style={{ fill: 'none', stroke: 'var(--accent)', strokeWidth: 2.6, strokeLinecap: 'round' }} />
      <path d="M7 24.5h18" style={{ stroke: 'var(--brand-ink)', strokeWidth: 2.6, strokeLinecap: 'round' }} />
    </svg>
  )
}
