import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/env'

/**
 * Ar Supabase įjungtos paskyros su slaptažodžiu be el. pašto patvirtinimo (jų reikia slapyvardžiams).
 * Kol šis nustatymas išjungtas, prisijungimo puslapyje rodomas tik Google mygtukas.
 */
export async function usernameLoginEnabled() {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_KEY }, next: { revalidate: 300 } })
    if (!r.ok) return false
    const s = await r.json()
    return s?.external?.email === true && s?.mailer_autoconfirm === true
  } catch {
    return false
  }
}
