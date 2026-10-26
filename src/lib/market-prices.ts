// Butų kainos pradžios puslapio diagramai.
// Duomenys: „Ober-Haus“ Lietuvos butų kainų indeksas (OHBI), vidutinė butų pardavimo kaina už m²
// penkiuose didmiesčiuose. Atnaujinkite kas mėnesį, kai „Ober-Haus“ paskelbia naują apžvalgą.
export const MARKET_PRICES = {
  period: '2026 m. rugsėjis',
  /** Bendras butų kainų pokytis 5 didmiesčiuose per 12 mėnesių, %. */
  yearChange: 13.7,
  sourceLabel: '„Ober-Haus“ butų kainų indeksas (OHBI)',
  sourceUrl: 'https://www.ober-haus.lt/rinkos_apzvalga/ohbi-apzvalga-2026-m-rugsejo-men/',
  cities: [
    { city: 'Vilnius', price: 3197, yearChange: 12.2 },
    { city: 'Kaunas', price: 2339, yearChange: 16.8 },
    { city: 'Klaipėda', price: 2103, yearChange: 12.9 },
    { city: 'Šiauliai', price: 1457, yearChange: 17.3 },
    { city: 'Panevėžys', price: 1432, yearChange: 17.5 },
  ],
}
