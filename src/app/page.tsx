import Link from 'next/link'
import { Icon, type IconName } from '@/components/icons'
import { ListingCard } from '@/components/ListingCard'
import { SearchForm } from '@/components/SearchForm'
import { SetupNotice } from '@/components/SetupNotice'
import { SortSelect } from '@/components/SortSelect'
import { isConfigured } from '@/lib/env'
import { MARKET_PRICES } from '@/lib/market-prices'
import { PAGE_SIZE, hrefFor, parseFilters, roomsApply, searchWords, type Filters, type SearchParams } from '@/lib/filters'
import { TYPES, fmt, nomWord, type Listing } from '@/lib/listings'
import { skyline } from '@/lib/picture'
import { createClient } from '@/lib/supabase/server'

const CARD_COLUMNS =
  'id,status,deal,type,city,district,street,price,old_price,area,rooms,floor,floors,plot,year,building,energy,purpose,features,published_at,listing_photos(path,position)'

const CATS: { type: Filters['type']; label: string; icon: IconName }[] = [
  { type: 'all', label: 'Visi', icon: 'all' },
  { type: 'butas', label: 'Butai', icon: 'butas' },
  { type: 'namas', label: 'Namai', icon: 'namas' },
  { type: 'sklypas', label: 'Sklypai', icon: 'sklypas' },
  { type: 'patalpos', label: 'Patalpos', icon: 'patalpos' },
  { type: 'garazas', label: 'Garažai', icon: 'garazas' },
]

type Supabase = Awaited<ReturnType<typeof createClient>>

function queryListings(supabase: Supabase, f: Filters) {
  let q = supabase
    .from('listings')
    .select(CARD_COLUMNS, { count: 'exact' })
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .eq('deal', f.deal)
  if (f.type !== 'all') q = q.eq('type', f.type)
  if (f.city) q = q.eq('city', f.city)
  if (f.city && f.district) q = q.eq('district', f.district)
  if (f.pmin != null) q = q.gte('price', f.pmin)
  if (f.pmax != null) q = q.lte('price', f.pmax)
  const areaCol = f.type === 'sklypas' ? 'area' : 'area_m2'
  if (f.amin != null) q = q.gte(areaCol, f.amin)
  if (f.amax != null) q = q.lte(areaCol, f.amax)
  if (f.rooms.length && roomsApply(f.type)) {
    const exact = f.rooms.filter((r) => r < 5)
    const parts = exact.length ? [`rooms.in.(${exact.join(',')})`] : []
    if (f.rooms.includes(5)) parts.push('rooms.gte.5')
    q = q.or(parts.join(','))
  }
  for (const w of searchWords(f.q)) q = q.ilike('search_text', `%${w}%`)
  if (f.sort === 'cheap') q = q.order('price', { ascending: true })
  else if (f.sort === 'dear') q = q.order('price', { ascending: false })
  else if (f.sort === 'big') q = q.order('area_m2', { ascending: false })
  else if (f.sort === 'unit') q = q.order('price_per_unit', { ascending: true })
  else q = q.order('published_at', { ascending: false })
  const from = (f.page - 1) * PAGE_SIZE
  return q.order('id', { ascending: false }).range(from, from + PAGE_SIZE - 1)
}

function chipsFor(f: Filters) {
  const c: { label: string; href: string }[] = []
  const unitP = f.deal === 'rent' ? '€/mėn.' : '€', unitA = f.type === 'sklypas' ? 'a' : 'm²'
  const range = (lbl: string, a: number | null, b: number | null, u: string) =>
    a != null && b != null ? `${lbl} ${fmt(a)}–${fmt(b)} ${u}` : a != null ? `${lbl} nuo ${fmt(a)} ${u}` : `${lbl} iki ${fmt(b!)} ${u}`
  if (f.city) c.push({ label: f.city, href: hrefFor({ ...f, city: '', district: '', page: 1 }) })
  if (f.city && f.district) c.push({ label: f.district, href: hrefFor({ ...f, district: '', page: 1 }) })
  if (f.q) c.push({ label: `„${f.q}“`, href: hrefFor({ ...f, q: '', page: 1 }) })
  if (f.pmin != null || f.pmax != null) c.push({ label: range('Kaina', f.pmin, f.pmax, unitP), href: hrefFor({ ...f, pmin: null, pmax: null, page: 1 }) })
  if (f.amin != null || f.amax != null) c.push({ label: range('Plotas', f.amin, f.amax, unitA), href: hrefFor({ ...f, amin: null, amax: null, page: 1 }) })
  if (f.rooms.length && roomsApply(f.type)) c.push({ label: `${f.rooms.map((r) => (r === 5 ? '5+' : r)).join(', ')} kamb.`, href: hrefFor({ ...f, rooms: [], page: 1 }) })
  return c
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  if (!isConfigured) return <SetupNotice />
  const f = parseFilters(await searchParams)
  const supabase = await createClient()
  const [listRes, countsRes, locRes] = await Promise.all([
    queryListings(supabase, f),
    supabase.rpc('listing_type_counts', { p_deal: f.deal }),
    supabase.rpc('listing_locations'),
  ])

  const listings = (listRes.data ?? []) as unknown as Listing[]
  const total = listRes.count ?? 0
  const counts = new Map<string, number>(((countsRes.data ?? []) as { type: string; n: number }[]).map((r) => [r.type, Number(r.n)]))
  const allCount = [...counts.values()].reduce((a, b) => a + b, 0)
  const locations = (locRes.data ?? []) as { city: string; district: string }[]
  const maxStat = Math.max(...MARKET_PRICES.cities.map((c) => c.price))
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const dealWord = f.deal === 'sale' ? 'pardavimui' : 'nuomai'
  let title = f.type === 'all' ? (f.deal === 'sale' ? 'Visi pardavimo skelbimai' : 'Visi nuomos skelbimai') : `${TYPES[f.type].many} ${dealWord}`
  if (f.city) title += ` · ${f.city}`
  const chips = chipsFor(f)

  return (
    <>
      <section className="hero" aria-labelledby="heroTitle">
        <div className="skyline" dangerouslySetInnerHTML={{ __html: skyline() }} />
        <div className="wrap hero-in">
          <div>
            <p className="eyebrow">Nekilnojamasis turtas visoje Lietuvoje</p>
            <h1 id="heroTitle">Butai, namai ir sklypai visoje Lietuvoje</h1>
            <p className="lead">Ieškokite pagal miestą, mikrorajoną, kainą ir plotą. Parduodate ar nuomojate? Prisijunkite su Google paskyra ir įdėkite skelbimą per kelias minutes.</p>
          </div>
          <SearchForm key={`${f.deal}|${f.type}|${f.city}`} filters={f} locations={locations} total={total} />
        </div>
      </section>

      <nav className="wrap cats" aria-label="Kategorijos">
        {CATS.map((c) => (
          <Link key={c.type} className="cat" href={hrefFor({ deal: f.deal, type: c.type })} aria-current={f.type === c.type ? 'true' : undefined}>
            <Icon name={c.icon} />
            <b>{c.label}</b>
            <small>{fmt(c.type === 'all' ? allCount : counts.get(c.type) ?? 0)} skelb.</small>
          </Link>
        ))}
      </nav>

      <section className="wrap results" id="rezultatai" aria-labelledby="resTitle">
        <div className="res-head">
          <div>
            <h2 id="resTitle">{title}</h2>
            <p className="res-count">{total ? `Rasta ${fmt(total)} ${nomWord(total)}` : 'Skelbimų nerasta'}</p>
          </div>
          <SortSelect filters={f} />
        </div>
        {chips.length > 0 && (
          <div className="chips">
            {chips.map((c) => (
              <span key={c.label} className="fchip">
                {c.label}
                <Link href={c.href} scroll={false} aria-label={`Pašalinti filtrą: ${c.label}`}><Icon name="close" /></Link>
              </span>
            ))}
            {chips.length > 1 && <Link className="link-btn" href={hrefFor({ deal: f.deal, type: f.type, sort: f.sort })} scroll={false}>Išvalyti viską</Link>}
          </div>
        )}

        {listRes.error ? (
          <div className="empty">
            <h3>Nepavyko įkelti skelbimų</h3>
            <p>Patikrinkite interneto ryšį ir atnaujinkite puslapį. Jei klaida kartojasi, patikrinkite Supabase nustatymus.</p>
          </div>
        ) : listings.length ? (
          <div className="cards">
            {listings.map((l) => <ListingCard key={l.id} listing={l} photoCount={l.listing_photos?.length} />)}
          </div>
        ) : (
          <div className="empty">
            <h3>{allCount ? 'Pagal pasirinktus filtrus skelbimų nėra' : 'Skelbimų dar nėra'}</h3>
            <p>{allCount
              ? 'Pabandykite padidinti kainos ribą, pasirinkti kitą mikrorajoną arba ieškoti visoje Lietuvoje.'
              : 'Būkite pirmas: įdėkite skelbimą, ir jis iškart atsiras čia.'}</p>
            {allCount
              ? <Link className="btn btn-ghost" href={hrefFor({ deal: f.deal })}>Išvalyti filtrus</Link>
              : <Link className="btn btn-cta" href="/mano/naujas">Įdėti skelbimą</Link>}
          </div>
        )}

        {pages > 1 && (
          <nav className="pager" aria-label="Puslapiai">
            {f.page > 1 && <Link className="btn btn-ghost" href={hrefFor({ ...f, page: f.page - 1 })}>Ankstesni</Link>}
            <span>{f.page} iš {pages}</span>
            {f.page < pages && <Link className="btn btn-ghost" href={hrefFor({ ...f, page: f.page + 1 })}>Kiti</Link>}
          </nav>
        )}
      </section>

      <section className="wrap stats" aria-labelledby="statsTitle">
        <div className="stats-card">
          <div className="stats-intro">
            <h2 id="statsTitle">Butų kainos miestuose</h2>
            <p>Vidutinė butų pasiūlos kaina už kvadratinį metrą, {MARKET_PRICES.period}. Paspauskite miestą, kad pamatytumėte jo butus.</p>
            <div className="big-figure">
              <b>{fmt(MARKET_PRICES.national)} €/m²</b>
              <span>Lietuvos vidurkis</span>
            </div>
            <p className="source">Šaltinis: <a href={MARKET_PRICES.sourceUrl} target="_blank" rel="noopener noreferrer">{MARKET_PRICES.sourceLabel}</a></p>
          </div>
          <div className="bars">
            {MARKET_PRICES.cities.map((c) => (
              <div className="bar-row" key={c.city}>
                <Link className="link-btn" href={hrefFor({ deal: 'sale', type: 'butas', city: c.city })}>{c.city}</Link>
                <div className="bar-track" aria-hidden="true"><div className="bar-fill" style={{ width: `${((c.price / maxStat) * 100).toFixed(1)}%` }} /></div>
                <span className="bar-val"><b>{fmt(c.price)} €/m²</b></span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
