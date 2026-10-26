import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/env'
import { usernameFromEmail } from '@/lib/username'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Iškviesta iš Server Component, kur slapukų rašyti negalima. Sesiją atnaujina proxy.ts.
        }
      },
    },
  })
}

/** Prisijungusio naudotojo duomenys iš patikrinto JWT arba null. */
export async function getSessionUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return { supabase, user: null }
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>
  const email = typeof claims.email === 'string' ? claims.email : ''
  const username = usernameFromEmail(email)
  return {
    supabase,
    user: {
      id: claims.sub,
      // Slapyvardžio paskyrų techninis adresas niekur nerodomas.
      email: username ? '' : email,
      username,
      name: String(meta.full_name ?? meta.name ?? username),
      avatar: typeof meta.avatar_url === 'string' ? meta.avatar_url : '',
      provider: String((claims.app_metadata as Record<string, unknown> | undefined)?.provider ?? ''),
    },
  }
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>['user']>
