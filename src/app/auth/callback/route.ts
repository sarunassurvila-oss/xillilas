import { NextResponse, type NextRequest } from 'next/server'
import { publicOrigin, safeNext } from '@/lib/safe-next'
import { createClient } from '@/lib/supabase/server'

// Google arba laiško nuoroda → Supabase → čia su ?code=. Kodą iškeičiame į sesiją ir grąžiname naudotoją ten, kur jis ėjo.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${publicOrigin(request)}${next}`)
  }
  return NextResponse.redirect(`${publicOrigin(request)}/prisijungti?klaida=1&next=${encodeURIComponent(next)}`)
}
