import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isConfigured, SUPABASE_KEY, SUPABASE_URL } from '@/lib/env'

/** Atnaujina Supabase sesijos slapukus kiekvienam užklausimui ir saugo /mano puslapius. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  if (!isConfigured) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      },
    },
  })

  // Tarp createServerClient ir getClaims nieko nedėkite: kitaip naudotojus gali atsitiktinai atjungti.
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims?.sub)

  const { pathname, search } = request.nextUrl
  if (!signedIn && (pathname === '/mano' || pathname.startsWith('/mano/'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/prisijungti'
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }
  return response
}
