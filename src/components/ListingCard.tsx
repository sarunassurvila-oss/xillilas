import Link from 'next/link'
import {
  ENERGY_CLASS, addrOf, coverOf, daysLabel, daysSince, fullTitle, fmt, photoUrl, priceLabel, specsOf, unitLabel,
  type Listing,
} from '@/lib/listings'
import { picture } from '@/lib/picture'

export function EnergyBadge({ value }: { value: string | null }) {
  if (!value) return null
  return <span className={`energy e-${ENERGY_CLASS[value] ?? 'd'}`} title={`Energinio naudingumo klasė ${value}`}>{value}</span>
}

export function ListingImage({ listing, variant = 'card' }: { listing: Listing; variant?: string }) {
  const cover = coverOf(listing)
  if (cover) return <img src={photoUrl(cover.path)} alt="" loading="lazy" decoding="async" />
  return <div className="illu" dangerouslySetInnerHTML={{ __html: picture(listing, variant) }} />
}

export function ListingCard({ listing: l, photoCount }: { listing: Listing; photoCount?: number }) {
  const days = daysSince(l.published_at)
  return (
    <article className="card">
      <div className="card-img">
        <ListingImage listing={l} />
        <div className="badges">
          {days <= 1 && <span className="badge new">Nauja</span>}
          {l.year && l.year >= new Date().getFullYear() - 2 && <span className="badge build">Nauja statyba</span>}
          {l.old_price && <span className="badge cut">Kaina sumažinta</span>}
        </div>
        {photoCount ? <span className="photo-count">{photoCount} nuotr.</span> : null}
      </div>
      <div className="card-body">
        <div className="price-row">
          <span className="price">
            {priceLabel(l)}
            {l.old_price ? <s className="old">{fmt(l.old_price)} €</s> : null}
          </span>
          <span className="unit">{unitLabel(l)}</span>
        </div>
        <h3><Link className="card-open" href={`/skelbimas/${l.id}`}>{fullTitle(l)}</Link></h3>
        <p className="addr">{addrOf(l)}</p>
        <p className="specs">{specsOf(l).map((s) => <span key={s}>{s}</span>)}</p>
        <div className="card-foot">
          <span>{daysLabel(days)}</span>
          <EnergyBadge value={l.energy} />
        </div>
      </div>
    </article>
  )
}
