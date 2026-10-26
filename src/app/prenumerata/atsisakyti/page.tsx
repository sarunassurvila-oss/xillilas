import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { unsubscribeByToken } from '@/app/prenumerata/actions'
import { Logo } from '@/components/icons'
import { SITE } from '@/lib/site'

export const metadata: Metadata = { title: 'Atsisakyti prenumeratos', robots: { index: false } }

type Props = { searchParams: Promise<{ t?: string; done?: string }> }

// Atsisakoma tik paspaudus mygtuką: kai kurios pašto programos pačios atidaro nuorodas laiškuose.
export default async function UnsubscribePage({ searchParams }: Props) {
  const { t = '', done } = await searchParams
  async function confirm() {
    'use server'
    const label = await unsubscribeByToken(t)
    redirect(`/prenumerata/atsisakyti?done=${label === null ? '0' : '1'}`)
  }
  return (
    <div className="wrap login">
      <div className="login-card">
        <Link className="brand" href="/"><Logo />{SITE.name}</Link>
        {done === '1' ? (
          <div><h1>Prenumerata sustabdyta</h1><p style={{ marginTop: 8 }}>Daugiau laiškų pagal šią paiešką nesiųsime. Vėl įjungti galite puslapyje „Prenumeratos“.</p></div>
        ) : done === '0' ? (
          <div><h1>Nuoroda nebegalioja</h1><p style={{ marginTop: 8 }}>Prenumerata nerasta. Jei laiškai vis dar ateina, prisijunkite ir sustabdykite ją puslapyje „Prenumeratos“.</p></div>
        ) : (
          <>
            <div><h1>Atsisakyti prenumeratos?</h1><p style={{ marginTop: 8 }}>Nebesiųsime laiškų apie naujus skelbimus pagal šią paiešką.</p></div>
            <form action={confirm}><button className="btn btn-cta" type="submit" style={{ width: '100%' }}>Atsisakyti</button></form>
          </>
        )}
        <p className="login-legal"><Link href="/mano/prenumeratos">Visos prenumeratos</Link> · <Link href="/">Į pradžią</Link></p>
      </div>
    </div>
  )
}
