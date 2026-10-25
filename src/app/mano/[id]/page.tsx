import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ListingForm } from '@/components/ListingForm'
import { SetupNotice } from '@/components/SetupNotice'
import { isConfigured } from '@/lib/env'
import { rowToInput } from '@/lib/listing-input'
import { effectiveStatus, fullTitle, statusLabel, type Listing } from '@/lib/listings'
import { getSessionUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Redaguoti skelbimą' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ nuotraukos?: string }> }

export default async function EditListingPage({ params, searchParams }: Props) {
  if (!isConfigured) return <SetupNotice />
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()
  const { supabase, user } = await getSessionUser()
  if (!user) redirect(`/prisijungti?next=/mano/${id}`)

  const { data } = await supabase
    .from('listings')
    .select('*, listing_photos(id,path,position)')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!data) notFound()
  const listing = data as unknown as Listing & { listing_photos: { id: number; path: string; position: number }[] }
  const status = effectiveStatus(listing)
  const photoError = (await searchParams).nuotraukos === 'klaida'

  return (
    <div className="wrap narrow page">
      <p className="crumbs"><Link href="/mano">Mano skelbimai</Link> / SL-{id}</p>
      <div className="page-head">
        <div>
          <h1>{fullTitle(listing)}</h1>
          <p>Būsena: <span className={`pill pill-${status}`}>{statusLabel(status, listing.deal)}</span></p>
        </div>
        <Link className="btn btn-ghost" href={`/skelbimas/${id}`}>Peržiūrėti skelbimą</Link>
      </div>
      {photoError && (
        <div className="banner warn" role="alert">Skelbimas išsaugotas, bet kai kurių nuotraukų įkelti nepavyko. Pridėkite jas dar kartą ir išsaugokite.</div>
      )}
      <ListingForm uid={user.id} listingId={id} status={status} initial={rowToInput(data)} photos={listing.listing_photos} />
    </div>
  )
}
