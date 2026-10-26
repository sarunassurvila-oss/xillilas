import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SubscriptionActions } from '@/components/SubscriptionActions'
import { SetupNotice } from '@/components/SetupNotice'
import { isConfigured } from '@/lib/env'
import { getSessionUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Prenumeratos' }

type Row = { id: number; label: string; query: string; active: boolean; created_at: string; last_sent_at: string | null }
const date = (iso: string) => new Date(iso).toLocaleDateString('lt-LT', { year: 'numeric', month: 'long', day: 'numeric' })

export default async function SubscriptionsPage() {
  if (!isConfigured) return <SetupNotice />
  const { supabase, user } = await getSessionUser()
  if (!user) redirect('/prisijungti?next=/mano/prenumeratos')
  const { data, error } = await supabase
    .from('saved_searches')
    .select('id,label,query,active,created_at,last_sent_at')
    .order('created_at', { ascending: false })
  const rows = (data ?? []) as Row[]

  return (
    <div className="wrap narrow page">
      <p className="crumbs"><Link href="/mano">Mano skelbimai</Link> / Prenumeratos</p>
      <div className="page-head">
        <div>
          <h1>Prenumeratos</h1>
          <p>Kai paskelbiamas naujas skelbimas pagal jūsų paiešką, siunčiame laišką adresu <b>{user.email}</b>.</p>
        </div>
      </div>
      {error ? (
        <div className="empty"><h3>Nepavyko įkelti prenumeratų</h3><p>Atnaujinkite puslapį.</p></div>
      ) : rows.length === 0 ? (
        <div className="empty">
          <h3>Prenumeratų dar nėra</h3>
          <p>Pasirinkite paieškos filtrus ir paspauskite „Gauti naujus skelbimus el. paštu“ – apie kiekvieną naują tinkantį skelbimą pranešime laišku.</p>
          <Link className="btn btn-cta" href="/#rezultatai">Ieškoti skelbimų</Link>
        </div>
      ) : (
        <ul className="subs">
          {rows.map((r) => (
            <li key={r.id} className={r.active ? 'sub' : 'sub off'}>
              <div className="sub-main">
                <Link className="sub-label" href={`/?${r.query}#rezultatai`}>{r.label}</Link>
                <span className="hint">
                  {r.active ? 'Aktyvi' : 'Sustabdyta'} · nuo {date(r.created_at)}
                  {r.last_sent_at ? ` · paskutinis laiškas ${date(r.last_sent_at)}` : ''}
                </span>
              </div>
              <SubscriptionActions id={r.id} active={r.active} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
