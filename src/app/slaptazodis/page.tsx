import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/icons'
import { ForgotPassword } from '@/components/ForgotPassword'
import { SITE } from '@/lib/site'

export const metadata: Metadata = { title: 'Slaptažodžio atkūrimas', robots: { index: false } }

export default function ForgotPasswordPage() {
  return (
    <div className="wrap login">
      <div className="login-card">
        <Link className="brand" href="/"><Logo />{SITE.name}</Link>
        <div>
          <h1>Pamiršote slaptažodį?</h1>
          <p style={{ marginTop: 8 }}>Įrašykite el. paštą, kuriuo registravotės. Atsiųsime nuorodą naujam slaptažodžiui susikurti.</p>
        </div>
        <ForgotPassword />
        <p className="login-legal"><Link href="/prisijungti">Grįžti į prisijungimą</Link></p>
      </div>
    </div>
  )
}
