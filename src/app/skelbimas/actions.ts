'use server'

import { createClient } from '@/lib/supabase/server'

/** Telefonas grąžinamas tik paspaudus „Rodyti numerį“, todėl jo nėra puslapio HTML. */
export async function getContactPhone(id: number) {
  if (!Number.isInteger(id)) return null
  const supabase = await createClient()
  const { data } = await supabase.from('listings').select('contact_phone').eq('id', id).maybeSingle()
  return data?.contact_phone ?? null
}
