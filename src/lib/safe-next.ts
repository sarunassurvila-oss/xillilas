/** Leidžia grįžti tik į šios svetainės puslapį (apsauga nuo atviro peradresavimo). */
export function safeNext(next: string | null | undefined, fallback = '/mano') {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}
