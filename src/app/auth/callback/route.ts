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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Skelbėjo tipas iš prisijungimo puslapio: naujai paskyrai – visada, esamai – tik jei pakeistas.
      const kind = searchParams.get('kind')
      const isNew = Date.now() - new Date(data.user.created_at).getTime() < 10 * 60 * 1000
      if ((kind === 'private' || kind === 'agency') && (isNew || searchParams.get('set') === '1')) {
        await supabase.from('profiles').update({ seller_kind: kind }).eq('id', data.user.id)
      }
      return NextResponse.redirect(`${publicOrigin(request)}${next}`)
    }
  }
  return NextResponse.redirect(`${publicOrigin(request)}/prisijungti?klaida=1&next=${encodeURIComponent(next)}`)
}
