import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Icon } from '@/components/icons'
import { ListingImage } from '@/components/ListingCard'
import { MyListingActions } from '@/components/MyListingActions'
import { SetupNotice } from '@/components/SetupNotice'
import { isConfigured } from '@/lib/env'
import {
  addrOf, dayWord, daysLeft, effectiveStatus, fmt, fullTitle, priceLabel, statusLabel,
  type EffectiveStatus, type Listing,
} from '@/lib/listings'
import { getSessionUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Mano skelbimai' }

const TABS = [
  { key: 'visi', label: 'Visi', match: (_: EffectiveStatus) => true },
  { key: 'aktyvus', label: 'Aktyvūs', match: (s: EffectiveStatus) => s === 'active' },
  { key: 'juodrasciai', label: 'Juodraščiai', match: (s: EffectiveStatus) => s === 'draft' },
  { key: 'neaktyvus', label: 'Neaktyvūs', match: (s: EffectiveStatus) => s === 'paused' || s === 'expired' || s === 'closed' },
] as const

const MESSAGES: Record<string, string> = {
  paskelbta: 'Skelbimas paskelbtas ir galioja 60 dienų.',
  issaugota: 'Pakeitimai išsaugoti.',
  juodrastis: 'Juodraštis išsaugotas. Jį matote tik jūs.',
}

type Props = { searchParams: Promise<{ ok?: string; tab?: string }> }

export default async function MyListingsPage({ searchParams }: Props) {
  if (!isConfigured) return <SetupNotice />
  const { supabase, user } = await getSessionUser()
  if (!user) redirect('/prisijungti?next=/mano')
  const sp = await searchParams

  const [{ data, error }, { data: profile }] = await Promise.all([
    supabase
      .from('listings')
      .select('id,status,deal,type,city,district,street,price,old_price,area,rooms,floor,floors,plot,year,building,energy,purpose,features,published_at,expires_at,updated_at,listing_photos(path,position)')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase.from('profiles').select('full_name,phone').eq('id', user.id).maybeSingle(),
  ])
  const listings = ((data ?? []) as unknown as Listing[]).map((l) => ({ ...l, eff: effectiveStatus(l) }))
  const tab = TABS.find((t) => t.key === sp.tab) ?? TABS[0]
  const shown = listings.filter((l) => tab.match(l.eff))
  const firstName = (profile?.full_name || user.name || '').split(' ')[0]

  return (
    <div className="wrap page">
      <div className="page-head">
        <div>
          <h1>Mano skelbimai</h1>
          <p>{firstName ? `Sveiki, ${firstName}. ` : ''}Čia galite keisti skelbimus, kainas ir būsenas.</p>
        </div>
        <Link className="btn btn-cta btn-lg" href="/mano/naujas"><Icon name="plus" />Įdėti naują skelbimą</Link>
      </div>

      {sp.ok && MESSAGES[sp.ok] && <div className="banner ok" role="status">{MESSAGES[sp.ok]}</div>}
      {!profile?.phone && (
        <div className="banner info">
          <span>Įrašykite telefono numerį profilyje, ir jis bus automatiškai įrašomas į naujus skelbimus.</span>
          <Link href="/mano/paskyra">Pildyti profilį</Link>
        </div>
      )}
      {error && <div className="banner warn" role="alert">Nepavyko įkelti jūsų skelbimų. Atnaujinkite puslapį.</div>}

      {listings.length > 0 && (
        <nav className="tabs" aria-label="Filtruoti pagal būseną">
          {TABS.map((t) => (
            <Link key={t.key} href={t.key === 'visi' ? '/mano' : `/mano?tab=${t.key}`} aria-current={t.key === tab.key ? 'page' : undefined}>
              {t.label} <small>{listings.filter((l) => t.match(l.eff)).length}</small>
            </Link>
          ))}
        </nav>
      )}

      {listings.length === 0 && !error ? (
        <div className="empty">
          <h3>Dar neturite skelbimų</h3>
          <p>Įdėkite pirmą skelbimą: užtruks kelias minutes. Paskelbtas skelbimas galioja 60 dienų, vėliau jį pratęsite vienu paspaudimu.</p>
          <Link className="btn btn-cta" href="/mano/naujas">Įdėti skelbimą</Link>
        </div>
      ) : shown.length === 0 ? (
        <div className="empty"><h3>Šioje skiltyje skelbimų nėra</h3></div>
      ) : (
        <div className="my-list">
          {shown.map((l) => {
            const left = daysLeft(l.expires_at)
            return (
              <article className="my-row" key={l.id}>
                <Link className="my-thumb" href={`/skelbimas/${l.id}`} tabIndex={-1} aria-hidden="true">
                  <ListingImage listing={l} variant="mine" />
                </Link>
                <div className="my-info">
                  <div className="my-meta">
                    <span className={`pill pill-${l.eff}`}>{statusLabel(l.eff, l.deal)}</span>
                    {l.eff === 'active' && <span>Galioja dar {left} {dayWord(left)}</span>}
                    {l.eff === 'expired' && <span>Nebegalioja, pratęskite, kad vėl matytųsi</span>}
                    <span>SL-{l.id}</span>
                  </div>
                  <h2><Link href={`/skelbimas/${l.id}`}>{fullTitle(l)}</Link></h2>
                  <p className="addr">{addrOf(l)}</p>
                  <div className="my-meta">
                    <span className="price">{priceLabel(l)}</span>
                    {l.old_price ? <s className="old" style={{ marginLeft: 0 }}>{fmt(l.old_price)} €</s> : null}
                    <span>{l.listing_photos?.length ?? 0} nuotr.</span>
                  </div>
                </div>
                <MyListingActions id={l.id} status={l.eff} deal={l.deal} daysLeft={left} />
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
