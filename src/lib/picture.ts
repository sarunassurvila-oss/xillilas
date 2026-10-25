import { titleOf, type Listing } from '@/lib/listings'

// Kai skelbimas be nuotraukų, rodoma sugeneruota objekto iliustracija (tas pats skelbimas visada atrodo vienodai).

type Rand = () => number
type Pick = <T>(a: T[]) => T

function rng(seed: number): Rand {
  let a = Math.imul(seed | 0, 0x9e3779b1) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const f1 = (n: number) => n.toFixed(1)
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function tree(x: number, y: number, s: number) {
  return `<rect x="${f1(x - 2 * s)}" y="${f1(y - 16 * s)}" width="${f1(4 * s)}" height="${f1(16 * s)}" fill="#5b4a3a"/><circle cx="${f1(x)}" cy="${f1(y - 20 * s)}" r="${f1(12 * s)}" fill="#56794a"/><circle cx="${f1(x + 6 * s)}" cy="${f1(y - 27 * s)}" r="${f1(9 * s)}" fill="#6a8f59"/>`
}

function drawFlat(l: Listing, r: Rand, pick: Pick, G: number) {
  let o = ''
  for (let i = 0; i < 3; i++) {
    const w = 60 + r() * 70, h = 60 + r() * 90, x = r() * 360 - 20
    o += `<rect x="${f1(x)}" y="${f1(G - h)}" width="${f1(w)}" height="${f1(h)}" fill="#7d8b93" opacity=".3"/>`
  }
  o += `<rect y="${G}" width="400" height="${260 - G}" fill="#9aa08f"/><rect y="${G}" width="400" height="5" fill="#bcbfb3"/>`
  const n = Math.max(3, Math.min(11, l.floors || 5)), fh = Math.min(18, 160 / n), bh = n * fh + 14
  const bw = 190 + r() * 70, bx = (400 - bw) / 2, by = G - bh
  const face = pick(['#e3dccd', '#cdd5d7', '#dccab4', '#c9d3c5', '#e8e2d6', '#d4c6c0'])
  const old = Boolean(l.year && l.year < 1950)
  if (old) o += `<polygon points="${f1(bx - 6)},${f1(by)} ${f1(bx + 24)},${f1(by - 26)} ${f1(bx + bw - 24)},${f1(by - 26)} ${f1(bx + bw + 6)},${f1(by)}" fill="#9a4b35"/>`
  o += `<rect x="${f1(bx)}" y="${f1(by)}" width="${f1(bw)}" height="${f1(bh)}" fill="${face}"/>`
  if (!old) o += `<rect x="${f1(bx - 5)}" y="${f1(by - 6)}" width="${f1(bw + 10)}" height="7" fill="#6b6f6c"/>`
  const cols = Math.max(4, Math.floor(bw / 36)), cw = (bw - 20) / cols, ww = Math.min(20, cw - 10), wh = fh * (old ? 0.66 : 0.56)
  for (let f = 0; f < n; f++) {
    const y = by + 8 + f * fh
    if (l.building === 'Blokinis') o += `<rect x="${f1(bx)}" y="${f1(y + fh - 1)}" width="${f1(bw)}" height="1" fill="#000" opacity=".12"/>`
    for (let c = 0; c < cols; c++) {
      const x = bx + 10 + c * cw + (cw - ww) / 2, lit = r() < 0.18
      o += `<rect x="${f1(x)}" y="${f1(y + (fh - wh) / 2)}" width="${f1(ww)}" height="${f1(wh)}" rx="${old ? 2 : 0}" fill="${lit ? '#f4d58a' : '#5a7482'}"/>`
      if (l.building === 'Monolitinis' && c % 2 === 0) o += `<rect x="${f1(x - 4)}" y="${f1(y + (fh + wh) / 2)}" width="${f1(ww + 8)}" height="2.5" fill="#7d868c"/>`
    }
  }
  o += `<rect x="191" y="${G - 16}" width="18" height="16" fill="#4d5a60"/>`
  return o + tree(bx - 18, G + 2, 1 + r() * 0.4) + tree(bx + bw + 22, G + 2, 0.9 + r() * 0.4)
}

function drawHouse(l: Listing, r: Rand, pick: Pick, G: number) {
  let o = ''
  for (let i = 0; i < 15; i++) o += `<ellipse cx="${f1(i * 29 + r() * 10)}" cy="${G - 12}" rx="${f1(18 + r() * 8)}" ry="${f1(16 + r() * 12)}" fill="#4f6e48" opacity=".55"/>`
  o += `<rect y="${G - 10}" width="400" height="${270 - G}" fill="#87a46f"/>`
  if (l.features.includes('Prie ežero')) o += `<rect y="${G + 16}" width="400" height="40" fill="#6f9fb8"/><rect y="${G + 16}" width="400" height="3" fill="#a9cadb"/>`
  const two = (l.floors || 1) > 1, w = 180, h = two ? 98 : 68, x = 110, y = G - h
  const wall = l.building === 'Medinis' || l.building === 'Rąstinis' ? '#b98c5c' : pick(['#efe9dc', '#d9d2c4', '#c8b8a0', '#e6ddd0', '#bcc5c2'])
  const roof = pick(['#4a3a34', '#3c4750', '#6b3e33', '#2f3a3a'])
  o += `<rect x="${x + 128}" y="${y - 40}" width="14" height="36" fill="${roof}"/>`
  o += `<polygon points="${x - 14},${y + 2} ${x + w / 2},${y - 54} ${x + w + 14},${y + 2}" fill="${roof}"/>`
  o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${wall}"/>`
  if (wall === '#b98c5c') for (let k = y + 6; k < G; k += 7) o += `<rect x="${x}" y="${k}" width="${w}" height="1" fill="#000" opacity=".14"/>`
  const win = (wx: number, wy: number, ww: number, wh: number) =>
    `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="${r() < 0.3 ? '#f4d58a' : '#5a7482'}" stroke="#f6f3ec" stroke-width="2.5"/>`
  o += win(x + 20, G - 46, 36, 28) + win(x + 124, G - 46, 36, 28)
  o += `<rect x="${x + 78}" y="${G - 42}" width="24" height="42" fill="#4a3a30"/>`
  if (two) o += win(x + 28, y + 14, 26, 24) + win(x + 77, y + 14, 26, 24) + win(x + 126, y + 14, 26, 24)
  else o += `<circle cx="${x + w / 2}" cy="${y - 20}" r="8" fill="#5a7482" stroke="#f6f3ec" stroke-width="2.5"/>`
  let fence = ''
  for (let k = 4; k < 400; k += 15) fence += `<rect x="${k}" y="${G + 1}" width="5" height="15" fill="#efeadf"/>`
  return o + tree(52, G + 4, 1.5) + tree(352, G + 4, 1.2) + fence + `<rect y="${G + 6}" width="400" height="2.5" fill="#efeadf"/>`
}

function drawPlot(l: Listing, r: Rand, pick: Pick) {
  const H = 150
  let o = ''
  for (let i = 0; i < 19; i++) o += `<ellipse cx="${f1(i * 23 + r() * 12)}" cy="${H}" rx="${f1(14 + r() * 10)}" ry="${f1(12 + r() * 16)}" fill="${pick(['#3f5c3c', '#4b6b45', '#355234'])}"/>`
  o += `<rect y="${H}" width="400" height="${260 - H}" fill="${pick(['#a9b86c', '#c4b878', '#98ae63'])}"/>`
  if (l.features.includes('Prie ežero')) o += `<ellipse cx="70" cy="${H + 8}" rx="150" ry="12" fill="#7fb0c8"/>`
  for (let i = -9; i <= 9; i++) o += `<line x1="200" y1="${H}" x2="${200 + i * 62}" y2="260" stroke="#000" stroke-opacity=".07" stroke-width="2"/>`
  const pts = [[96, 214], [318, 222], [282, 168], [128, 164]]
  o += `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="#fff" fill-opacity=".08" stroke="#fff" stroke-opacity=".8" stroke-dasharray="7 6" stroke-width="2"/>`
  pts.forEach(([px, py]) => {
    o += `<rect x="${px - 2}" y="${py - 18}" width="4" height="18" fill="#f1ecdf"/><rect x="${px - 2}" y="${py - 18}" width="4" height="5" fill="#e46b2a"/>`
  })
  if (l.features.includes('Elektra')) o += `<rect x="364" y="${H - 64}" width="4" height="74" fill="#6b5a48"/><rect x="352" y="${H - 58}" width="28" height="3" fill="#6b5a48"/><path d="M0 ${H - 40} Q180 ${H - 20} 354 ${H - 57}" stroke="#333" stroke-opacity=".5" fill="none"/>`
  return o
}

function drawOffice(l: Listing, r: Rand, pick: Pick, G: number) {
  let o = `<rect y="${G}" width="400" height="${260 - G}" fill="#a3a59c"/>`
  if (l.year && l.year < 1950) {
    const face = pick(['#e4cfa8', '#d9b99a', '#e7d9bf'])
    o += `<polygon points="44,64 70,36 330,36 356,64" fill="#9a4b35"/><rect x="50" y="64" width="300" height="${G - 64}" fill="${face}"/>`
    for (let row = 0; row < 2; row++) for (let c = 0; c < 6; c++) o += `<rect x="${70 + c * 46}" y="${80 + row * 44}" width="22" height="30" rx="11" fill="#5a7482"/>`
    o += `<rect x="50" y="${G - 58}" width="300" height="8" fill="#c08a2e"/>`
    for (let c = 0; c < 3; c++) o += `<rect x="${66 + c * 96}" y="${G - 46}" width="76" height="46" fill="#3e5560" stroke="#2d3b42" stroke-width="2"/>`
  } else {
    o += `<rect x="64" y="34" width="272" height="${G - 34}" fill="#5f7f8f"/><polygon points="64,34 170,34 64,170" fill="#fff" opacity=".14"/>`
    for (let x = 64; x <= 336; x += 34) o += `<rect x="${x - 1}" y="34" width="2" height="${G - 64}" fill="#d8e0e3"/>`
    for (let y = 34; y < G - 30; y += 26) o += `<rect x="64" y="${y}" width="272" height="2" fill="#d8e0e3"/>`
    o += `<rect x="64" y="${G - 30}" width="272" height="30" fill="#2f3d44"/><rect x="150" y="${G - 24}" width="100" height="12" rx="2" fill="#e9a51a"/>`
  }
  return o + tree(30, G + 4, 1.1) + tree(376, G + 4, 1)
}

function drawGarage(r: Rand, pick: Pick, G: number) {
  let o = tree(70, G - 70, 1.3) + tree(330, G - 70, 1.1)
  o += `<rect y="${G}" width="400" height="${260 - G}" fill="#a7a596"/><rect x="20" y="${G - 84}" width="360" height="84" fill="#c9bfae"/><rect x="14" y="${G - 94}" width="372" height="11" fill="#7b7d78"/>`
  for (let i = 0; i < 4; i++) {
    const x = 34 + i * 88
    o += `<rect x="${x}" y="${G - 68}" width="72" height="68" fill="${pick(['#6f7f8a', '#8a6f5a', '#5f7466', '#7a7f86'])}"/>`
    for (let k = G - 62; k < G; k += 8) o += `<rect x="${x}" y="${k}" width="72" height="1.4" fill="#000" opacity=".18"/>`
  }
  return o
}

/** SVG eilutė; `variant` atskiria tą patį skelbimą skirtingose puslapio vietose (unikalūs gradientų id). */
export function picture(l: Listing, variant = 'card') {
  const r = rng(l.id * 7 + 3)
  const pick: Pick = (a) => a[Math.floor(r() * a.length)]
  const u = `sky-${variant}-${l.id}`
  const s = pick([['#8fb8d6', '#dfeaf0'], ['#e9a87e', '#f6dcc0'], ['#aeb9c1', '#e4e8ea'], ['#6f9cc0', '#cfe0ea'], ['#c7a6c4', '#f1dccf']])
  let g = `<rect width="400" height="260" fill="url(#${u})"/>`
  if (r() < 0.5) g += `<circle cx="${f1(60 + r() * 280)}" cy="${f1(32 + r() * 26)}" r="${f1(14 + r() * 8)}" fill="#fff4d6" opacity=".85"/>`
  for (let i = 0; i < 2; i++) g += `<ellipse cx="${f1(r() * 400)}" cy="${f1(24 + r() * 48)}" rx="${f1(30 + r() * 30)}" ry="${f1(7 + r() * 5)}" fill="#fff" opacity=".55"/>`
  const G = 224
  if (l.type === 'butas') g += drawFlat(l, r, pick, G)
  else if (l.type === 'namas') g += drawHouse(l, r, pick, G)
  else if (l.type === 'sklypas') g += drawPlot(l, r, pick)
  else if (l.type === 'patalpos') g += drawOffice(l, r, pick, G)
  else g += drawGarage(r, pick, G)
  return `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Iliustracija: ${esc(titleOf(l))}"><defs><linearGradient id="${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s[0]}"/><stop offset="1" stop-color="${s[1]}"/></linearGradient></defs>${g}</svg>`
}

export function skyline() {
  const r = rng(42)
  let x = 0, o = ''
  while (x < 1600) {
    const w = 30 + r() * 70, h = 16 + r() * 46
    o += `<rect x="${f1(x)}" y="${f1(96 - h)}" width="${f1(w + 1)}" height="${f1(h)}"/>`
    if (r() < 0.12 && Math.abs(x - 940) > 80) {
      const sx = x + w / 2
      o += `<rect x="${f1(sx - 5)}" y="${f1(96 - h - 26)}" width="10" height="26"/><polygon points="${f1(sx - 7)},${f1(96 - h - 26)} ${f1(sx)},${f1(96 - h - 52)} ${f1(sx + 7)},${f1(96 - h - 26)}"/>`
    }
    x += w
  }
  o += `<rect x="938" y="2" width="4" height="94"/><rect x="932" y="22" width="16" height="12" rx="4"/>`
  return `<svg viewBox="0 0 1600 96" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${o}</svg>`
}
