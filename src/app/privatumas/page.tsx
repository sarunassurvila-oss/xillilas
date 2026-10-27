import type { Metadata } from 'next'
import { SITE } from '@/lib/site'

export const metadata: Metadata = { title: 'Privatumo politika' }

export default function PrivacyPage() {
  return (
    <div className="wrap narrow page">
      <div className="page-head"><div><h1>Privatumo politika</h1><p>Kokius duomenis renkame ir kodėl.</p></div></div>
      <div className="panel prose">
        <p>Duomenų valdytojas: {SITE.company}, įm. k. {SITE.companyCode}, {SITE.address}. Klausimus siųskite adresu {SITE.email}.</p>
        <h2>Kokius duomenis gauname</h2>
        <ul>
          <li><b>Prisijungiant per Google:</b> vardą, el. pašto adresą ir profilio nuotrauką. Google slaptažodžio nematome.</li>
          <li><b>Kuriant paskyrą el. paštu:</b> el. pašto adresą ir slaptažodį. Slaptažodis saugomas tik užšifruotas (kaip maiša), todėl jo nematome net mes. Šiuo adresu siunčiame tik paskyros patvirtinimo ir slaptažodžio atkūrimo laiškus.</li>
          <li><b>Profilyje:</b> vardą ar įmonės pavadinimą, telefono numerį ir skelbėjo tipą (privatus asmuo ar įmonė). Įmonės gali įkelti logotipą – jis rodomas viešai šalia jų skelbimų.</li>
          <li><b>Skelbimuose:</b> objekto aprašymą, adresą, kainą, nuotraukas ir telefono numerį (rodomas paspaudus). Šie duomenys yra vieši. Privataus asmens vardas skelbimuose nerodomas ir juose nesaugomas – rodoma „Privatus pardavėjas“; įmonių skelbimuose rodomas įmonės pavadinimas.</li>
          <li><b>Prenumeratose:</b> pasirinktus paieškos filtrus. Apie naujus tinkančius skelbimus rašome jūsų paskyros el. pašto adresu (laiškus siunčia Brevo). Atsisakyti galite kiekvieno laiško apačioje arba puslapyje „Prenumeratos“.</li>
          <li><b>Techniniai duomenys:</b> sesijos slapukai, būtini prisijungimui išlaikyti.</li>
        </ul>
        <h2>Kam naudojame</h2>
        <p>Paskyrai sukurti ir apsaugoti, skelbimams rodyti ir valdyti, svetainės veikimui užtikrinti. Duomenų neparduodame ir nenaudojame reklamai be jūsų sutikimo.</p>
        <h2>Kur saugoma</h2>
        <p>Duomenys saugomi Supabase infrastruktūroje Europos Sąjungoje. Prisijungimą per Google teikia Google pagal savo privatumo taisykles. Žemėlapius rodome naudodami OpenFreeMap (OpenStreetMap duomenys), o skelbimo adresą į koordinates paverčiame OpenStreetMap paieška – jai perduodamas tik objekto adresas.</p>
        <h2>Kiek laiko saugome</h2>
        <p>Kol turite paskyrą. Ištrynus paskyrą, kartu ištrinami profilis, visi skelbimai ir nuotraukos.</p>
        <h2>Jūsų teisės</h2>
        <p>Galite susipažinti su savo duomenimis, juos ištaisyti ar ištrinti. Paskyrą ištrinti galite patys puslapyje „Profilis ir kontaktai“. Taip pat turite teisę pateikti skundą Valstybinei duomenų apsaugos inspekcijai.</p>
      </div>
    </div>
  )
}
