import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { publicOrigin, safeNext } from '@/lib/safe-next'
import { createClient } from '@/lib/supabase/server'

// Nuoroda iš patvirtinimo ar slaptažodžio atkūrimo laiško (su token_hash). Veikia ir kitame įrenginyje nei registruotasi.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = safeNext(searchParams.get('next'))

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(`${publicOrigin(request)}${next}`)
  }
  return NextResponse.redirect(`${publicOrigin(request)}/prisijungti?klaida=1`)
}
