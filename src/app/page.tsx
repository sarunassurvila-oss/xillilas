import Link from 'next/link'
import { Icon, type IconName } from '@/components/icons'
import { ListingCard } from '@/components/ListingCard'
import { SearchForm } from '@/components/SearchForm'
import { SetupNotice } from '@/components/SetupNotice'
import { SortSelect } from '@/components/SortSelect'
import { isConfigured } from '@/lib/env'
import { MARKET_PRICES } from '@/lib/market-prices'
import { ADV_DEFAULTS, PAGE_SIZE, advApplies, hrefFor, parseFilters, roomsApply, searchWords, type Filters, type SearchParams } from '@/lib/filters'
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
    // Su „!inner“ lieka tik skelbimai, turintys bent vieną nuotrauką.
    .select(f.photos ? CARD_COLUMNS.replace('listing_photos(', 'listing_photos!inner(') : CARD_COLUMNS, { count: 'exact' })
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
  // Išsami paieška
  const t = f.type
  if (advApplies('floor', t)) {
    if (f.fmin != null) q = q.gte('floor', f.fmin)
    if (f.fmax != null) q = q.lte('floor', f.fmax)
    if (f.notFirst) q = q.gt('floor', 1)
    if (f.notLast) q = q.eq('floor_is_last', false)
  }
  if (advApplies('year', t)) {
    if (f.ymin != null) q = q.gte('year', f.ymin)
    if (f.ymax != null) q = q.lte('year', f.ymax)
  }
  if (advApplies('plot', t)) {
    if (f.plmin != null) q = q.gte('plot', f.plmin)
    if (f.plmax != null) q = q.lte('plot', f.plmax)
  }
  if (f.umin != null) q = q.gte('price_per_unit', f.umin)
  if (f.umax != null) q = q.lte('price_per_unit', f.umax)
  if (advApplies('building', t) && f.building.length) q = q.in('building', f.building)
  if (advApplies('heating', t) && f.heating.length) q = q.in('heating', f.heating)
  if (advApplies('finish', t) && f.finish.length) q = q.in('finish', f.finish)
  if (advApplies('energy', t) && f.energy) q = q.eq('energy', f.energy)
  if (advApplies('purpose', t) && f.purpose) q = q.eq('purpose', f.purpose)
  if (f.features.length) q = q.contains('features', f.features)
  if (f.days != null) q = q.gte('published_at', new Date(Date.now() - f.days * 864e5).toISOString())
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
  const t = f.type
  const add = (label: string, patch: Partial<Filters>) => c.push({ label, href: hrefFor({ ...f, ...patch, page: 1 }) })
  const between = (lbl: string, a: number | null, b: number | null, u = '') =>
    a != null && b != null ? `${lbl} ${a}–${b}${u}` : a != null ? `${lbl} nuo ${a}${u}` : `${lbl} iki ${b}${u}`
  if (advApplies('floor', t)) {
    if (f.fmin != null || f.fmax != null) add(between('Aukštas', f.fmin, f.fmax), { fmin: null, fmax: null })
    if (f.notFirst) add('Ne pirmas aukštas', { notFirst: false })
    if (f.notLast) add('Ne paskutinis aukštas', { notLast: false })
  }
  if (advApplies('year', t) && (f.ymin != null || f.ymax != null)) add(between('Statyta', f.ymin, f.ymax, ' m.'), { ymin: null, ymax: null })
  if (advApplies('plot', t) && (f.plmin != null || f.plmax != null)) add(between('Sklypas', f.plmin, f.plmax, ' a'), { plmin: null, plmax: null })
  if (f.umin != null || f.umax != null) add(between(t === 'sklypas' ? 'Už arą' : 'Už m²', f.umin, f.umax, ' €'), { umin: null, umax: null })
  if (advApplies('building', t) && f.building.length) add(f.building.join(', '), { building: [] })
  if (advApplies('heating', t) && f.heating.length) add(`Šildymas: ${f.heating.join(', ')}`, { heating: [] })
  if (advApplies('finish', t) && f.finish.length) add(f.finish.join(', '), { finish: [] })
  if (advApplies('energy', t) && f.energy) add(`Energinė klasė ${f.energy}`, { energy: '' })
  if (advApplies('purpose', t) && f.purpose) add(`Paskirtis: ${f.purpose}`, { purpose: '' })
  if (f.features.length) add(f.features.join(', '), { features: [] })
  if (f.days != null) add(f.days === 1 ? 'Per 24 val.' : `Per ${f.days} d.`, { days: null })
  if (f.photos) add('Su nuotraukomis', { photos: false })
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
  const pct = (v: number) => `${v.toLocaleString('lt-LT', { minimumFractionDigits: 1 })} %`
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
            <p className="lead">Ieškokite pagal miestą, mikrorajoną, kainą ir plotą. Parduodate ar nuomojate? Prisijunkite ir įdėkite skelbimą per kelias minutes.</p>
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
            {chips.length > 1 && <Link className="link-btn" href={hrefFor({ deal: f.deal, type: f.type, sort: f.sort, ...ADV_DEFAULTS })} scroll={false}>Išvalyti viską</Link>}
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
            <p>Vidutinė butų pardavimo kaina už kvadratinį metrą didmiesčiuose, {MARKET_PRICES.period}. Paspauskite miestą, kad pamatytumėte jo butus.</p>
            <div className="big-figure">
              <b>+{pct(MARKET_PRICES.yearChange)}</b>
              <span>tiek per metus pabrango butai didmiesčiuose</span>
            </div>
            <p className="source">Pagal viešai skelbiamus NT rinkos tyrimus.</p>
          </div>
          <div className="bars">
            {MARKET_PRICES.cities.map((c) => (
              <div className="bar-row" key={c.city}>
                <Link className="link-btn" href={hrefFor({ deal: 'sale', type: 'butas', city: c.city })}>{c.city}</Link>
                <div className="bar-track" aria-hidden="true"><div className="bar-fill" style={{ width: `${((c.price / maxStat) * 100).toFixed(1)}%` }} /></div>
                <span className="bar-val"><b>{fmt(c.price)} €/m²</b><small title="Pokytis per metus">+{pct(c.yearChange)}</small></span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
