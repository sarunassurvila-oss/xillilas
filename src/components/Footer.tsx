import Link from 'next/link'
import { Logo } from '@/components/icons'
import { SITE } from '@/lib/site'

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <div className="foot-brand">
          <Link className="brand" href="/"><Logo />{SITE.name}</Link>
          <p className="foot-note">Butų, namų, sklypų, patalpų ir garažų skelbimai visoje Lietuvoje. Skelbimus įdeda ir tvarko patys savininkai bei agentūros.</p>
          <p className="foot-note" style={{ fontSize: 12.5 }}>Gatvių sąrašas: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> bendraautoriai (ODbL).</p>
        </div>
        <div>
          <h4>Kategorijos</h4>
          <ul>
            <li><Link href="/?type=butas#rezultatai">Butai</Link></li>
            <li><Link href="/?type=namas#rezultatai">Namai</Link></li>
            <li><Link href="/?type=sklypas#rezultatai">Sklypai</Link></li>
            <li><Link href="/?type=patalpos#rezultatai">Patalpos</Link></li>
            <li><Link href="/?type=garazas#rezultatai">Garažai</Link></li>
          </ul>
        </div>
        <div>
          <h4>Skelbėjams</h4>
          <ul>
            <li><Link href="/mano/naujas">Įdėti skelbimą</Link></li>
            <li><Link href="/mano">Mano skelbimai</Link></li>
            <li><Link href="/taisykles">Naudojimosi taisyklės</Link></li>
            <li><Link href="/privatumas">Privatumo politika</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
