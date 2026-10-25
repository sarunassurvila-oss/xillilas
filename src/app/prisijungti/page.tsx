import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/icons'
import { LoginButtons } from '@/components/LoginButtons'
import { SetupNotice } from '@/components/SetupNotice'
import { isConfigured } from '@/lib/env'
import { safeNext } from '@/lib/safe-next'
import { getSessionUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Prisijungti', robots: { index: false } }

type Props = { searchParams: Promise<{ next?: string; klaida?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  if (!isConfigured) return <SetupNotice />
  const sp = await searchParams
  const next = safeNext(sp.next)
  const { user } = await getSessionUser()
  if (user) redirect(next)

  const posting = next.startsWith('/mano/naujas')
  return (
    <div className="wrap login">
      <div className="login-card">
        <Link className="brand" href="/"><Logo />Slenkstis</Link>
        <div>
          <h1>{posting ? 'Prisijunkite ir įdėkite skelbimą' : 'Prisijunkite prie Slenksčio'}</h1>
          <p style={{ marginTop: 8 }}>
            Nereikia kurti slaptažodžio. Prisijungę galėsite įdėti skelbimą, keisti kainą, pristabdyti ar pažymėti parduotu.
          </p>
        </div>
        {sp.klaida && (
          <p className="banner warn" role="alert" style={{ margin: 0 }}>Prisijungti nepavyko arba jis buvo atšauktas. Bandykite dar kartą.</p>
        )}
        <LoginButtons next={next} />
        <p className="login-legal">
          Prisijungdami sutinkate su <Link href="/taisykles">naudojimosi taisyklėmis</Link> ir <Link href="/privatumas">privatumo politika</Link>.
          Iš Google gauname tik jūsų vardą, el. pašto adresą ir profilio nuotrauką.
        </p>
      </div>
    </div>
  )
}
