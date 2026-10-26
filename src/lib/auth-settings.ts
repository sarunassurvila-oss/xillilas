import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/env'
import { SITE } from '@/lib/site'

/**
 * Ar rodyti prisijungimą el. paštu ir slaptažodžiu. Reikia, kad Supabase būtų įjungtos el. pašto paskyros
 * ir prijungta laiškų siuntimo paslauga (SITE.emailLogin), nes be jos patvirtinimo laiškai žmonių nepasiekia.
 */
export async function emailLoginEnabled() {
  if (!SITE.emailLogin && process.env.EMAIL_LOGIN !== '1') return false
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_KEY }, next: { revalidate: 300 } })
    if (!r.ok) return false
    const s = await r.json()
    return s?.external?.email === true
  } catch {
    return false
  }
}
