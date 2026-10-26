import { createClient } from '@supabase/supabase-js'
import type { MetadataRoute } from 'next'
import { isConfigured, SUPABASE_KEY, SUPABASE_URL } from '@/lib/env'
import { TYPE_KEYS } from '@/lib/listings'
import { SITE } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, changeFrequency: 'hourly', priority: 1 },
    ...TYPE_KEYS.flatMap((t) => [
      { url: `${SITE.url}/?type=${t}`, changeFrequency: 'daily' as const, priority: 0.8 },
      { url: `${SITE.url}/?deal=rent&type=${t}`, changeFrequency: 'daily' as const, priority: 0.7 },
    ]),
    { url: `${SITE.url}/taisykles`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE.url}/privatumas`, changeFrequency: 'yearly', priority: 0.2 },
  ]
  if (!isConfigured) return pages
  // Be slapukų: žemėlapyje tik viešai matomi (aktyvūs) skelbimai.
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
  const { data } = await supabase
    .from('listings')
    .select('id,updated_at')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('updated_at', { ascending: false })
    .limit(5000)
  return [
    ...pages,
    ...(data ?? []).map((l) => ({ url: `${SITE.url}/skelbimas/${l.id}`, lastModified: l.updated_at, changeFrequency: 'weekly' as const, priority: 0.6 })),
  ]
}
