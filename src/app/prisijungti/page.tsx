import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/icons'
import { LoginButtons } from '@/components/LoginButtons'
import { SetupNotice } from '@/components/SetupNotice'
import { EmailAuth } from '@/components/EmailAuth'
import { emailLoginEnabled } from '@/lib/auth-settings'
import { isConfigured } from '@/lib/env'
import { safeNext } from '@/lib/safe-next'
import { SITE } from '@/lib/site'
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
  const withEmail = await emailLoginEnabled()
  return (
    <div className="wrap login">
      <div className="login-card">
        <Link className="brand" href="/"><Logo />{SITE.name}</Link>
        <div>
          <h1>{posting ? 'Prisijunkite ir įdėkite skelbimą' : `Prisijunkite prie ${SITE.name}`}</h1>
          <p style={{ marginTop: 8 }}>
            {withEmail ? 'Per Google arba el. paštu ir slaptažodžiu. ' : 'Nereikia kurti slaptažodžio. '}
            Prisijungę galėsite įdėti skelbimą, keisti kainą, pristabdyti ar pažymėti parduotu.
          </p>
        </div>
        {sp.klaida && (
          <p className="banner warn" role="alert" style={{ margin: 0 }}>Prisijungti nepavyko arba nuoroda nebegalioja. Jei jau patvirtinote el. paštą, prisijunkite slaptažodžiu.</p>
        )}
        <LoginButtons next={next} />
        {withEmail && (
          <>
            <p className="login-or"><span>arba</span></p>
            <EmailAuth next={next} />
          </>
        )}
        <p className="login-legal">
          Prisijungdami sutinkate su <Link href="/taisykles">naudojimosi taisyklėmis</Link> ir <Link href="/privatumas">privatumo politika</Link>.
          Jungiantis per Google, gauname tik jūsų vardą, el. pašto adresą ir profilio nuotrauką.
        </p>
      </div>
    </div>
  )
}
