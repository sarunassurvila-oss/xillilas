'use client'

import { useRouter } from 'next/navigation'
import { SORTS, toQuery, type Filters, type SortKey } from '@/lib/filters'

export function SortSelect({ filters }: { filters: Filters }) {
  const router = useRouter()
  return (
    <label className="sort">
      Rūšiuoti
      <select value={filters.sort} onChange={(e) => {
        const qs = toQuery({ ...filters, sort: e.target.value as SortKey, page: 1 })
        router.replace(`/${qs ? `?${qs}` : ''}`, { scroll: false })
      }}>
        {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </label>
  )
}
