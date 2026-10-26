import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ChangePassword } from '@/components/ChangePassword'
import { getSessionUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Naujas slaptažodis', robots: { index: false } }

// Čia patenkama iš slaptažodžio atkūrimo laiško: nuoroda jau prijungė naudotoją.
export default async function NewPasswordPage() {
  const { user } = await getSessionUser()
  if (!user) redirect('/prisijungti?klaida=1')
  return (
    <div className="wrap narrow page">
      <div className="page-head"><div><h1>Susikurkite naują slaptažodį</h1><p>Paskyra: <b>{user.email}</b></p></div></div>
      <div className="form">
        <ChangePassword title="Naujas slaptažodis" doneHref="/mano" />
      </div>
    </div>
  )
}
