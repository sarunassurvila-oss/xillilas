import Link from 'next/link'
import { AccountMenu } from '@/components/AccountMenu'
import { Icon, Logo } from '@/components/icons'
import { isConfigured } from '@/lib/env'
import { getSessionUser } from '@/lib/supabase/server'

const NAV = [
  ['butas', 'Butai'], ['namas', 'Namai'], ['sklypas', 'Sklypai'], ['patalpos', 'Patalpos'], ['garazas', 'Garažai'],
] as const

export async function Header() {
  const user = isConfigured ? (await getSessionUser()).user : null
  return (
    <header className="top">
      <div className="wrap top-in">
        <Link className="brand" href="/" aria-label="Slenkstis, į pradžią">
          <Logo />
          Slenkstis
        </Link>
        <nav className="main-nav" aria-label="Kategorijos">
          {NAV.map(([type, label]) => (
            <Link key={type} className="nav-link" href={`/?type=${type}#rezultatai`}>{label}</Link>
          ))}
        </nav>
        <div className="top-actions">
          {user ? (
            <>
              <Link className="btn btn-ghost hide-sm" href="/mano">Mano skelbimai</Link>
              <AccountMenu name={user.name} email={user.email} avatar={user.avatar} />
            </>
          ) : (
            <Link className="btn btn-ghost" href="/prisijungti">Prisijungti</Link>
          )}
          <Link className="btn btn-cta" href="/mano/naujas">
            <Icon name="plus" />
            <span>Įdėti<span className="hide-sm"> skelbimą</span></span>
          </Link>
        </div>
      </div>
    </header>
  )
}
