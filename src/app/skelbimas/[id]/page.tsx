import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { Gallery } from '@/components/Gallery'
import { EnergyBadge, ListingCard } from '@/components/ListingCard'
import { LoanCalculator } from '@/components/LoanCalculator'
import { PhoneReveal } from '@/components/PhoneReveal'
import { PointMap } from '@/components/PointMap'
import { SetupNotice } from '@/components/SetupNotice'
import { isConfigured } from '@/lib/env'
import { hrefFor } from '@/lib/filters'
import { googleMapsUrl } from '@/lib/geo'
import {
  TYPES, addrOf, daysLabel, daysSince, effectiveStatus, fmt, fmt1, fullTitle, logoUrl, photoUrl, priceLabel, statusLabel, unitLabel,
  type Listing,
} from '@/lib/listings'
import { picture } from '@/lib/picture'
import { createClient, getSessionUser } from '@/lib/supabase/server'

// contact_phone sąmoningai neįtrauktas: jį parodo PhoneReveal tik paspaudus.
const DETAIL_COLUMNS =
  'id,owner_id,status,deal,type,city,district,street,price,old_price,area,rooms,floor,floors,plot,year,building,heating,finish,energy,purpose,features,description,contact_name,seller_kind,seller_logo,published_at,expires_at,lat,lng,listing_photos(path,position)'
const CARD_COLUMNS =
  'id,status,deal,type,city,district,street,price,old_price,area,rooms,floor,floors,plot,year,building,energy,purpose,features,published_at,listing_photos(path,position)'

const getListing = cache(async (id: number) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('listings')
    .select(DETAIL_COLUMNS)
    .eq('id', id)
    .order('position', { referencedTable: 'listing_photos' })
    .maybeSingle()
  return data as unknown as Listing | null
})

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isConfigured) return {}
  const id = Number((await params).id)
  const l = Number.isInteger(id) ? await getListing(id) : null
  if (!l) return { title: 'Skelbimas nerastas' }
  const cover = [...(l.listing_photos ?? [])].sort((a, b) => a.position - b.position)[0]
  const title = `${fullTitle(l)} – ${l.city}, ${priceLabel(l)}`
  const description = (l.description || addrOf(l)).slice(0, 160)
  return {
    title,
    description,
    alternates: { canonical: `/skelbimas/${l.id}` },
    // Pasidalinus skelbimu Facebook'e ar Messenger'yje rodoma pirmoji nuotrauka.
    openGraph: { type: 'article', title, description, ...(cover ? { images: [{ url: photoUrl(cover.path) }] } : {}) },
  }
}

export default async function ListingPage({ params }: Props) {
  if (!isConfigured) return <SetupNotice />
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()
  const l = await getListing(id)
  if (!l) notFound()

  const { supabase, user } = await getSessionUser()
  const isOwner = user?.id === l.owner_id
  const status = effectiveStatus(l)

  let similar: Listing[] = []
  if (status === 'active') {
    const base = () => supabase.from('listings').select(CARD_COLUMNS)
      .eq('status', 'active').gt('expires_at', new Date().toISOString())
      .eq('type', l.type).eq('deal', l.deal).neq('id', l.id)
      .order('published_at', { ascending: false }).limit(3)
    const { data: sameCity } = await base().eq('city', l.city)
    similar = (sameCity ?? []) as unknown as Listing[]
    if (similar.length < 3) {
      const { data: others } = await base().neq('city', l.city)
      similar = [...similar, ...((others ?? []) as unknown as Listing[])].slice(0, 3)
    }
  }

  const photos = [...(l.listing_photos ?? [])].sort((a, b) => a.position - b.position).map((p) => photoUrl(p.path))
  const title = fullTitle(l)
  const rows: [string, React.ReactNode][] = []
  const add = (k: string, v: React.ReactNode) => { if (v !== null && v !== undefined && v !== '') rows.push([k, v]) }
  add(l.type === 'sklypas' ? 'Sklypo plotas' : 'Plotas', l.type === 'sklypas' ? `${fmt1(l.area)} a` : `${fmt1(l.area)} m²`)
  add('Paskirtis', l.purpose)
  add('Kambarių sk.', l.rooms)
  if (l.floor) add('Aukštas', l.floors ? `${l.floor} iš ${l.floors}` : l.floor)
  else if (l.type === 'namas') add('Aukštų sk.', l.floors)
  if (l.type === 'namas' && l.plot) add('Sklypo plotas', `${fmt1(l.plot)} a`)
  add('Statybos metai', l.year)
  add('Pastato tipas', l.building)
  add('Šildymas', l.heating)
  add('Įrengimas', l.finish)
  if (l.energy) add('Energinė klasė', <EnergyBadge value={l.energy} />)
  if (l.deal === 'sale') add(l.type === 'sklypas' ? 'Kaina už arą' : 'Kaina už m²', unitLabel(l))
  add('Skelbimo nr.', `SL-${l.id}`)

  return (
    <div className="wrap page">
      <p className="crumbs">
        <Link href={hrefFor({ deal: l.deal })}>{l.deal === 'sale' ? 'Pardavimas' : 'Nuoma'}</Link>
        {' / '}
        <Link href={hrefFor({ deal: l.deal, type: l.type })}>{TYPES[l.type].many}</Link>
        {' / '}
        <Link href={hrefFor({ deal: l.deal, type: l.type, city: l.city })}>{l.city}</Link>
      </p>

      {isOwner && (
        <div className={`banner ${status === 'active' ? 'ok' : 'warn'}`}>
          <span>
            Tai jūsų skelbimas. Būsena: <b>{statusLabel(status, l.deal)}</b>
            {status !== 'active' && '. Kiti lankytojai jo nemato.'}
          </span>
          <Link href={`/mano/${l.id}`}>Redaguoti</Link>
        </div>
      )}

      <div className="d-grid">
        <div className="d-main">
          {photos.length ? (
            <Gallery photos={photos} alt={title} />
          ) : (
            <div className="g-main"><div className="illu" dangerouslySetInnerHTML={{ __html: picture(l, 'hero') }} /></div>
          )}

          <div style={{ marginTop: 22 }}>
            <p className="d-crumb">{TYPES[l.type].many} · {l.deal === 'sale' ? 'Pardavimas' : 'Nuoma'} · {daysLabel(daysSince(l.published_at))}</p>
            <h1>{title}</h1>
            <p className="d-addr">{addrOf(l)}</p>
            <div className="d-price">
              <span className="price">{priceLabel(l)}</span>
              {l.old_price ? <s className="old">{fmt(l.old_price)} €</s> : null}
              <span className="unit">{unitLabel(l)}</span>
            </div>
          </div>

          <h2>Pagrindinė informacija</h2>
          <dl className="spec-grid">
            {rows.map(([k, v]) => <div className="spec" key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>

          {l.features.length > 0 && (
            <>
              <h2>Ypatybės</h2>
              <ul className="feats">{l.features.map((x) => <li key={x}>{x}</li>)}</ul>
            </>
          )}

          {l.description && (
            <>
              <h2>Aprašymas</h2>
              <p className="d-desc">{l.description}</p>
            </>
          )}

          {l.lat != null && l.lng != null && (
            <>
              <h2>Vieta žemėlapyje</h2>
              <PointMap lat={l.lat} lng={l.lng} />
              <p className="hint">
                {addrOf(l)}. Vieta gali būti nurodyta apytiksliai.{' '}
                <a href={googleMapsUrl(l.lat, l.lng)} target="_blank" rel="noopener noreferrer">Atidaryti Google Maps ↗</a>
              </p>
            </>
          )}
        </div>

        <aside className="d-side">
          <section className="box" aria-label="Kontaktai">
            {l.seller_kind === 'agency' ? (
              <div className="seller">
                {l.seller_logo && <img className="seller-logo" src={logoUrl(l.seller_logo)} alt="" />}
                <div>
                  <p className="muted">{l.deal === 'sale' ? 'Pardavėjas' : 'Nuomotojas'} · įmonė</p>
                  <p className="seller-name">{l.contact_name}</p>
                </div>
              </div>
            ) : (
              <>
                <p className="muted">Kontaktai</p>
                <p className="seller-name">{l.deal === 'sale' ? 'Privatus pardavėjas' : 'Privatus nuomotojas'}</p>
              </>
            )}
            <PhoneReveal listingId={l.id} />
          </section>
          {l.deal === 'sale' && ['butas', 'namas', 'sklypas'].includes(l.type) && <LoanCalculator price={l.price} />}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="similar" aria-labelledby="simH">
          <h2 id="simH">Panašūs skelbimai</h2>
          <div className="cards">
            {similar.map((s) => <ListingCard key={s.id} listing={s} photoCount={s.listing_photos?.length} />)}
          </div>
        </section>
      )}
    </div>
  )
}
