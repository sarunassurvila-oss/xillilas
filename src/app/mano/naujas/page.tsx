import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ListingForm } from '@/components/ListingForm'
import { SetupNotice } from '@/components/SetupNotice'
import { isConfigured } from '@/lib/env'
import { emptyInput } from '@/lib/listing-input'
import { getSessionUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Naujas skelbimas' }

export default async function NewListingPage() {
  if (!isConfigured) return <SetupNotice />
  const { supabase, user } = await getSessionUser()
  if (!user) redirect('/prisijungti?next=/mano/naujas')
  const { data: profile } = await supabase.from('profiles').select('full_name,phone,seller_kind').eq('id', user.id).maybeSingle()

  const kind = profile?.seller_kind === 'agency' ? 'agency' : 'private'
  return (
    <div className="wrap narrow page">
      <p className="crumbs"><Link href="/mano">Mano skelbimai</Link> / Naujas</p>
      <div className="page-head">
        <div>
          <h1>Naujas skelbimas</h1>
          <p>Paskelbtas skelbimas iškart matomas paieškoje ir galioja 60 dienų.</p>
        </div>
      </div>
      <ListingForm uid={user.id} sellerKind={kind} initial={emptyInput(profile?.full_name || user.name, profile?.phone ?? '', kind)} />
    </div>
  )
}
