// Lietuvos miestai ir jų mikrorajonai (rajonų savivaldybėms – pagrindinės gyvenvietės).
// Paieškoje prie šio sąrašo papildomai rodomos vietos, kurias skelbėjai įrašė patys („Kita…“).

const CENTRAS = ['Centras']

export const BIG_CITIES: Record<string, string[]> = {
  Vilnius: [
    'Antakalnis', 'Antavilis', 'Aukštieji Paneriai', 'Bajorai', 'Balsiai', 'Baltupiai', 'Bukčiai', 'Burbiškės', 'Didieji Gulbinai',
    'Dvarčionys', 'Fabijoniškės', 'Filaretai', 'Gineitiškės', 'Grigiškės', 'Jeruzalė', 'Justiniškės', 'Kalnėnai', 'Karoliniškės',
    'Kirtimai', 'Lazdynai', 'Lazdynėliai', 'Liepkalnis', 'Markučiai', 'Mažieji Gulbinai', 'Naujamiestis', 'Naujininkai', 'Naujoji Vilnia',
    'Paneriai', 'Pašilaičiai', 'Pavilnys', 'Pilaitė', 'Rasos', 'Santariškės', 'Senamiestis', 'Šeškinė', 'Šiaurės miestelis', 'Šnipiškės',
    'Tarandė', 'Trakų Vokė', 'Užupis', 'Valakampiai', 'Verkiai', 'Vilkpėdė', 'Viršuliškės', 'Visoriai', 'Žemieji Paneriai', 'Žirmūnai', 'Žvėrynas',
  ],
  Kaunas: [
    'Aleksotas', 'Amaliai', 'Centras', 'Dainava', 'Eiguliai', 'Freda', 'Gričiupis', 'Kalniečiai', 'Kleboniškis', 'Lampėdžiai', 'Marvelė',
    'Naujasodis', 'Palemonas', 'Panemunė', 'Petrašiūnai', 'Rokai', 'Romainiai', 'Sargėnai', 'Senamiestis', 'Šančiai', 'Šilainiai',
    'Vaišvydava', 'Vičiūnai', 'Vilijampolė', 'Žaliakalnis',
  ],
  Klaipėda: [
    'Alksnynė', 'Baltija', 'Bandužiai', 'Centras', 'Debrecenas', 'Dragūnai', 'Gedminai', 'Giruliai', 'Labrenciškės', 'Laukininkai',
    'Melnragė', 'Miško', 'Naujakiemis', 'Paupiai', 'Pempininkai', 'Poilsis', 'Rumpiškės', 'Senamiestis', 'Smiltynė', 'Sportininkai',
    'Tauralaukis', 'Vingis', 'Žardininkai',
  ],
  Šiauliai: ['Centras', 'Dainai', 'Gubernija', 'Gytariai', 'Kalniukas', 'Lieporiai', 'Medelynas', 'Pabaliai', 'Rėkyva', 'Šimšė', 'Talša', 'Zokniai', 'Žaliūkiai'],
  Panevėžys: ['Centras', 'Kalnapilis', 'Klaipėdos', 'Kniaudiškiai', 'Molainiai', 'Pilėnai', 'Pramonės', 'Ramygalos', 'Rožynas', 'Skaistakalnis', 'Tulpių', 'Žemaičiai'],
  Alytus: ['Centras', 'Dainava', 'Likiškėliai', 'Pirmasis Alytus', 'Putinai', 'Ulonai', 'Vidzgiris'],
}

export const RESORTS: Record<string, string[]> = {
  Palanga: ['Centras', 'Vanagupė', 'Kunigiškiai', 'Nemirseta', 'Šventoji', 'Būtingė'],
  Druskininkai: ['Centras', 'Viečiūnai', 'Leipalingis'],
  Neringa: ['Nida', 'Juodkrantė', 'Preila', 'Pervalka'],
  Birštonas: CENTRAS,
}

const TOWNS = [
  'Marijampolė', 'Mažeikiai', 'Jonava', 'Utena', 'Kėdainiai', 'Telšiai', 'Tauragė', 'Ukmergė', 'Visaginas', 'Plungė', 'Kretinga', 'Šilutė',
  'Radviliškis', 'Gargždai', 'Rokiškis', 'Biržai', 'Elektrėnai', 'Kuršėnai', 'Garliava', 'Jurbarkas', 'Vilkaviškis', 'Raseiniai', 'Anykščiai',
  'Lentvaris', 'Prienai', 'Joniškis', 'Kelmė', 'Varėna', 'Kaišiadorys', 'Pasvalys', 'Kupiškis', 'Zarasai', 'Skuodas', 'Kazlų Rūda',
  'Širvintos', 'Molėtai', 'Šalčininkai', 'Šakiai', 'Ignalina', 'Pabradė', 'Kybartai', 'Šilalė', 'Pakruojis', 'Nemenčinė', 'Trakai',
  'Švenčionėliai', 'Švenčionys', 'Vievis', 'Lazdijai', 'Kalvarija', 'Rietavas', 'Žiežmariai', 'Eišiškės', 'Ariogala', 'Šeduva',
  'Naujoji Akmenė', 'Akmenė', 'Venta', 'Viekšniai', 'Tytuvėnai', 'Rūdiškės', 'Kudirkos Naumiestis', 'Simnas', 'Vilkija', 'Jieznas',
  'Linkuva', 'Dusetos', 'Ramygala', 'Kavarskas', 'Baltoji Vokė', 'Užventis', 'Salantai', 'Seda', 'Smalininkai', 'Žagarė', 'Joniškėlis',
  'Pandėlys', 'Pagėgiai', 'Subačius', 'Varniai', 'Virbalis', 'Gelgaudiškis', 'Daugai', 'Dūkštas', 'Ežerėlis', 'Obeliai', 'Skaudvilė',
  'Troškūnai', 'Vabalninkas', 'Veisiejai', 'Priekulė',
]
const TOWN_DISTRICTS: Record<string, string[]> = {
  Marijampolė: ['Centras', 'Degučiai', 'Mokolai', 'Tarpučiai'],
  Mažeikiai: ['Centras', 'Ventos', 'Pavenčiai'],
  Jonava: ['Centras', 'Lietavos', 'Rimkai'],
  Utena: ['Centras', 'Aukštakalnis', 'Dauniškis'],
  Trakai: ['Centras', 'Senamiestis', 'Totoriškės', 'Galvės'],
}

export const DISTRICT_MUNICIPALITIES: Record<string, string[]> = {
  'Vilniaus r.': [
    'Avižieniai', 'Bezdonys', 'Didžioji Riešė', 'Juodšiliai', 'Kalveliai', 'Lavoriškės', 'Maišiagala', 'Marijampolis', 'Medininkai', 'Mickūnai',
    'Nemenčinė', 'Nemėžis', 'Paberžė', 'Pagiriai', 'Pikutiškės', 'Rudamina', 'Rukainiai', 'Sudervė', 'Sužionys', 'Šatrininkai', 'Zujūnai',
  ],
  'Kauno r.': [
    'Akademija', 'Babtai', 'Čekiškė', 'Domeikava', 'Ežerėlis', 'Garliava', 'Giraitė', 'Karmėlava', 'Kulautuva', 'Lapės', 'Neveronys',
    'Noreikiškės', 'Ramučiai', 'Raudondvaris', 'Ringaudai', 'Samylai', 'Užliedžiai', 'Vilkija', 'Zapyškis',
  ],
  'Klaipėdos r.': [
    'Agluonėnai', 'Dituva', 'Dovilai', 'Drevernos', 'Endriejavas', 'Gargždai', 'Jakai', 'Kalotė', 'Karklė', 'Kretingalė', 'Plikiai',
    'Priekulė', 'Sendvaris', 'Slengiai', 'Veiviržėnai', 'Vėžaičiai',
  ],
  'Trakų r.': ['Aukštadvaris', 'Grendavė', 'Lentvaris', 'Onuškis', 'Paluknys', 'Rūdiškės', 'Senieji Trakai', 'Totoriškės', 'Užutrakis'],
  'Šiaulių r.': ['Bubiai', 'Ginkūnai', 'Gilvyčiai', 'Gruzdžiai', 'Kairiai', 'Kuršėnai', 'Kurtuvėnai', 'Kužiai', 'Meškuičiai', 'Raudėnai', 'Šakyna'],
  'Panevėžio r.': ['Berčiūnai', 'Karsakiškis', 'Krekenava', 'Miežiškiai', 'Naujamiestis', 'Paįstrys', 'Ramygala', 'Raguva', 'Smilgiai', 'Upytė', 'Vadokliai', 'Velžys'],
  'Alytaus r.': ['Alovė', 'Butrimonys', 'Daugai', 'Krokialaukis', 'Miroslavas', 'Nemunaitis', 'Pivašiūnai', 'Punia', 'Simnas'],
  'Kretingos r.': ['Darbėnai', 'Kartena', 'Kretinga', 'Kūlupėnai', 'Salantai', 'Žalgiriai'],
}

/** Miestų grupės pasirinkimo laukeliui (rodomos kaip <optgroup>). */
export const CITY_GROUPS: { label: string; cities: string[] }[] = [
  { label: 'Didieji miestai', cities: Object.keys(BIG_CITIES) },
  { label: 'Kurortai', cities: Object.keys(RESORTS) },
  { label: 'Kiti miestai', cities: [...new Set(TOWNS)].sort((a, b) => a.localeCompare(b, 'lt')) },
  { label: 'Rajonai (priemiesčiai)', cities: Object.keys(DISTRICT_MUNICIPALITIES) },
]

export const ALL_CITIES = CITY_GROUPS.flatMap((g) => g.cities)

export function districtsOf(city: string): string[] {
  return BIG_CITIES[city] ?? RESORTS[city] ?? DISTRICT_MUNICIPALITIES[city] ?? TOWN_DISTRICTS[city] ?? (ALL_CITIES.includes(city) ? CENTRAS : [])
}

/** Failo vardas gatvių sąrašui public/streets/<slug>.json (pvz. „Vilniaus r.“ → „vilniaus-r“). */
export function citySlug(city: string) {
  return city.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
