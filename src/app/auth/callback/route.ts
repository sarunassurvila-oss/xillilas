import { NextResponse, type NextRequest } from 'next/server'
import { safeNext } from '@/lib/safe-next'
import { createClient } from '@/lib/supabase/server'

// Google → Supabase → čia su ?code=. Kodą iškeičiame į sesiją ir grąžiname naudotoją ten, kur jis ėjo.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const base = process.env.NODE_ENV === 'development' || !forwardedHost ? origin : `https://${forwardedHost}`
      return NextResponse.redirect(`${base}${next}`)
    }
  }
  return NextResponse.redirect(`${origin}/prisijungti?klaida=1&next=${encodeURIComponent(next)}`)
}
