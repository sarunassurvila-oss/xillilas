import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChangePassword } from '@/components/ChangePassword'
import { DeleteAccount } from '@/components/DeleteAccount'
import { ProfileForm } from '@/components/ProfileForm'
import { SetupNotice } from '@/components/SetupNotice'
import { isConfigured } from '@/lib/env'
import { getSessionUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Profilis' }

const PROVIDERS: Record<string, string> = { google: 'Google', email: 'el. paštą' }

export default async function ProfilePage() {
  if (!isConfigured) return <SetupNotice />
  const { supabase, user } = await getSessionUser()
  if (!user) redirect('/prisijungti?next=/mano/paskyra')
  const { data: profile } = await supabase.from('profiles').select('full_name,phone,seller_kind').eq('id', user.id).maybeSingle()

  return (
    <div className="wrap narrow page">
      <p className="crumbs"><Link href="/mano">Mano skelbimai</Link> / Profilis</p>
      <div className="page-head">
        <div>
          <h1>Profilis ir kontaktai</h1>
          <p>Prisijungta per {PROVIDERS[user.provider] ?? user.provider} kaip <b>{user.email || 'paslėptas el. paštas'}</b>.</p>
        </div>
      </div>
      <div className="form">
        <ProfileForm
          fullName={profile?.full_name || user.name}
          phone={profile?.phone ?? ''}
          sellerKind={profile?.seller_kind === 'agency' ? 'agency' : 'private'}
        />
        {user.provider === 'email' && <ChangePassword />}
        <DeleteAccount uid={user.id} />
      </div>
    </div>
  )
}
