export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** false, kol .env.local nesukonfigūruotas: puslapiai tada rodo paruošimo instrukciją, o ne klaidą. */
export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY)

export const PHOTO_BUCKET = 'listing-photos'
