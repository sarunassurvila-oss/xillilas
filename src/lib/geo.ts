// Bendros žemėlapio reikšmės serveriui ir naršyklei (be MapLibre).

/** Lietuva: centras ir ribos [vakarai, pietūs, rytai, šiaurė]. Tos pačios ribos patikrinamos duomenų bazėje. */
export const LT_CENTER: [number, number] = [23.9, 55.17]
export const LT_BOUNDS: [number, number, number, number] = [20.9, 53.8, 26.9, 56.5]
export const inLithuania = (lat: number, lng: number) =>
  lat >= LT_BOUNDS[1] && lat <= LT_BOUNDS[3] && lng >= LT_BOUNDS[0] && lng <= LT_BOUNDS[2]

/** Trumpa kaina žemėlapio žymei: „189 000 €“, „1,2 mln. €“, „650 €/mėn.“ */
export function shortPrice(price: number, deal: 'sale' | 'rent') {
  if (deal === 'rent') return `${new Intl.NumberFormat('lt-LT').format(Math.round(price))} €/mėn.`
  if (price >= 1_000_000) return `${new Intl.NumberFormat('lt-LT', { maximumFractionDigits: 1 }).format(price / 1_000_000)} mln. €`
  return `${new Intl.NumberFormat('lt-LT').format(Math.round(price))} €`
}

/** Nuoroda į Google Maps (telefone atsidaro programėlė). */
export const googleMapsUrl = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`
