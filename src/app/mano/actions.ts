'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { PHOTO_BUCKET } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import { PHONE_RE, validateListing, type ListingInput } from '@/lib/validate'

async function requireUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const uid = data?.claims?.sub
  if (!uid) redirect('/prisijungti?next=/mano')
  return { supabase, uid }
}

/** Duomenų bazės klaidos (pvz. skelbimų limitas) jau parašytos lietuviškai, kitos pakeičiamos bendru tekstu. */
function dbMessage(error: { code?: string; message?: string } | null) {
  if (error?.code === 'P0001' && error.message) return error.message
  return 'Nepavyko išsaugoti. Patikrinkite ryšį ir bandykite dar kartą.'
}

function refresh(id?: number) {
  revalidatePath('/')
  revalidatePath('/mano')
  if (id) revalidatePath(`/skelbimas/${id}`)
}

export type SaveResult = { ok: true; id: number } | { ok: false; errors: Record<string, string>; message: string }

/** publish: 'active' paskelbia, 'draft' išsaugo juodraštį, 'keep' palieka esamą būseną. */
export async function saveListing(input: ListingInput, publish: 'active' | 'draft' | 'keep', id?: number): Promise<SaveResult> {
  const { supabase } = await requireUser()
  const { row, errors } = validateListing(input)
  if (!row) return { ok: false, errors, message: 'Patikrinkite pažymėtus laukus.' }
  const payload = publish === 'keep' ? row : { ...row, status: publish }

  const res = id
    ? await supabase.from('listings').update(payload).eq('id', id).select('id').maybeSingle()
    : await supabase.from('listings').insert(payload).select('id').single()
  if (res.error) return { ok: false, errors: {}, message: dbMessage(res.error) }
  if (!res.data) return { ok: false, errors: {}, message: 'Skelbimas nerastas arba neturite teisės jo keisti.' }
  refresh(res.data.id)
  return { ok: true, id: res.data.id }
}

export type ActionResult = { ok: boolean; message?: string }

export async function setListingStatus(id: number, status: 'active' | 'paused' | 'closed'): Promise<ActionResult> {
  const { supabase } = await requireUser()
  const { data, error } = await supabase.from('listings').update({ status }).eq('id', id).select('id').maybeSingle()
  if (error || !data) return { ok: false, message: error ? dbMessage(error) : 'Skelbimas nerastas.' }
  refresh(id)
  return { ok: true }
}

/** Pratęsia galiojimą 60 dienų nuo šiandien (ilgiau neleidžia pati duomenų bazė). */
export async function extendListing(id: number): Promise<ActionResult> {
  const { supabase } = await requireUser()
  const until = new Date(Date.now() + 60 * 864e5).toISOString()
  const { data, error } = await supabase.from('listings').update({ expires_at: until }).eq('id', id).select('id').maybeSingle()
  if (error || !data) return { ok: false, message: error ? dbMessage(error) : 'Skelbimas nerastas.' }
  refresh(id)
  return { ok: true }
}

export async function deleteListing(id: number): Promise<ActionResult> {
  const { supabase } = await requireUser()
  const { data: photos } = await supabase.from('listing_photos').select('path').eq('listing_id', id)
  if (photos?.length) await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((p) => p.path))
  const { error } = await supabase.from('listings').delete().eq('id', id)
  if (error) return { ok: false, message: dbMessage(error) }
  refresh(id)
  return { ok: true }
}

export type ProfileState = { ok: boolean; message: string; errors: Record<string, string> }

export async function saveProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const { supabase, uid } = await requireUser()
  const full_name = String(form.get('full_name') ?? '').trim().slice(0, 80)
  const phone = String(form.get('phone') ?? '').trim()
  const seller_kind = form.get('seller_kind') === 'agency' ? 'agency' : 'private'
  const errors: Record<string, string> = {}
  if (!full_name) errors.full_name = 'Įrašykite vardą arba įmonės pavadinimą.'
  if (phone && !PHONE_RE.test(phone)) errors.phone = 'Įrašykite telefono numerį, pvz. +370 612 34567.'
  if (Object.keys(errors).length) return { ok: false, message: 'Patikrinkite pažymėtus laukus.', errors }

  const { error } = await supabase.from('profiles').upsert({ id: uid, full_name, phone: phone || null, seller_kind })
  if (error) return { ok: false, message: 'Nepavyko išsaugoti profilio. Bandykite dar kartą.', errors: {} }
  revalidatePath('/mano', 'layout')
  return { ok: true, message: 'Profilis išsaugotas.', errors: {} }
}
