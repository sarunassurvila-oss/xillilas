/** Leidžia grįžti tik į šios svetainės puslapį (apsauga nuo atviro peradresavimo). */
export function safeNext(next: string | null | undefined, fallback = '/mano') {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}

/** Viešas svetainės adresas peradresavimams (už Vercel ar kito tarpinio serverio). */
export function publicOrigin(request: { headers: Headers; nextUrl: { origin: string } }) {
  const host = request.headers.get('x-forwarded-host')
  if (process.env.NODE_ENV === 'development' || !host) return request.nextUrl.origin
  return `${request.headers.get('x-forwarded-proto') ?? 'https'}://${host}`
}
