import { NextResponse, type NextRequest } from 'next/server'
import { unsubscribeByToken } from '@/app/prenumerata/actions'

// Pašto programų mygtukas „Atsisakyti“ (RFC 8058: List-Unsubscribe-Post).
export async function POST(request: NextRequest) {
  const label = await unsubscribeByToken(request.nextUrl.searchParams.get('t') ?? '')
  return NextResponse.json({ ok: label !== null })
}
