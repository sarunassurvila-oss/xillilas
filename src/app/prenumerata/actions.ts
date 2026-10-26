'use server'

import { revalidatePath } from 'next/cache'
import { criteriaOf, describeFilters, parseFilters, searchQueryOf } from '@/lib/filters'
import { createClient, getSessionUser } from '@/lib/supabase/server'

export type SubscribeResult =
  | { ok: true; email: string; already?: boolean }
  | { ok: false; message: string; login?: boolean }

/** Prenumeruoti dabartinę paiešką (query – puslapio adreso užklausa be „?“). */
export async function subscribeSearch(query: string): Promise<SubscribeResult> {
  const { supabase, user } = await getSessionUser()
  if (!user) return { ok: false, login: true, message: 'Prisijunkite, kad galėtumėte prenumeruoti.' }
  if (!user.email) return { ok: false, message: 'Jūsų paskyroje nėra el. pašto adreso.' }
  const f = parseFilters(Object.fromEntries(new URLSearchParams(query.slice(0, 2000))))
  const row = { criteria: criteriaOf(f), query: searchQueryOf(f), label: describeFilters(f) }
  const { error } = await supabase.from('saved_searches').insert(row)
  if (error?.code === '23505') {
    // Ta pati paieška jau išsaugota – jei buvo sustabdyta, vėl įjungiama.
    await supabase.from('saved_searches').update({ active: true }).eq('query', row.query)
    return { ok: true, email: user.email, already: true }
  }
  if (error) return { ok: false, message: error.code === 'P0001' ? error.message : 'Nepavyko. Bandykite dar kartą.' }
  revalidatePath('/mano/prenumeratos')
  return { ok: true, email: user.email }
}

export async function setSubscriptionActive(id: number, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('saved_searches').update({ active }).eq('id', id)
  revalidatePath('/mano/prenumeratos')
  return !error
}

export async function deleteSubscription(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('saved_searches').delete().eq('id', id)
  revalidatePath('/mano/prenumeratos')
  return !error
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Atsisakymas pagal nuorodą laiške (be prisijungimo). Grąžina prenumeratos pavadinimą arba null. */
export async function unsubscribeByToken(token: string): Promise<string | null> {
  if (!UUID_RE.test(token)) return null
  const supabase = await createClient()
  const { data } = await supabase.rpc('unsubscribe_saved_search', { p_token: token })
  return typeof data === 'string' ? data : null
}
