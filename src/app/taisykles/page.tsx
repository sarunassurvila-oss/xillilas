import type { Metadata } from 'next'
import { SITE } from '@/lib/site'

export const metadata: Metadata = { title: 'Naudojimosi taisyklės' }

export default function RulesPage() {
  return (
    <div className="wrap narrow page">
      <div className="page-head"><div><h1>Naudojimosi taisyklės</h1><p>Trumpai apie tai, ką galima ir ko negalima skelbti.</p></div></div>
      <div className="panel prose">
        <h2>Skelbimai</h2>
        <ul>
          <li>Skelbkite tik tikrus objektus, kuriuos turite teisę parduoti ar nuomoti.</li>
          <li>Nurodykite tikrą kainą, plotą ir vietą. Nuotraukos turi būti to paties objekto.</li>
          <li>Vienas objektas skelbiamas vieną kartą. Pasikeitus kainai, redaguokite esamą skelbimą.</li>
          <li>Paskelbtas skelbimas galioja {SITE.listingDays} dienų. Jį galite pratęsti, pristabdyti ar pažymėti parduotu bet kada.</li>
          <li>Vienas naudotojas gali turėti iki 50 skelbimų.</li>
        </ul>
        <h2>Draudžiama</h2>
        <ul>
          <li>Klaidinanti ar neteisinga informacija, svetimos nuotraukos.</li>
          <li>Skelbimai, nesusiję su nekilnojamuoju turtu.</li>
          <li>Kitų žmonių kontaktai be jų sutikimo.</li>
        </ul>
        <p>Taisyklių pažeidžiančius skelbimus galime pašalinti, o pakartotinai pažeidžiančias paskyras užblokuoti. Pastebėję netinkamą skelbimą, parašykite adresu {SITE.email}.</p>
      </div>
    </div>
  )
}
