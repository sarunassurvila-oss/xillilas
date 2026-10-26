// Butų kainų vidurkiai pradžios puslapio lentelei.
// Duomenys: aruodas.lt pranešimas spaudai (2026 m. rugsėjis), vidutinė butų pasiūlos kaina už m².
// Atnaujinkite rankiniu būdu, kai aruodas.lt paskelbs naujus duomenis.
export const MARKET_PRICES = {
  period: '2026 m. sausis–rugpjūtis',
  national: 3290,
  sourceLabel: 'aruodas.lt duomenys, paskelbta 15min.lt',
  sourceUrl:
    'https://www.15min.lt/verslas/naujiena/nt-ir-interjeras/1-kv-m-kainos-istorija-kiek-per-15-metu-isaugo-butu-kainos-lietuvoje-971-2770524',
  cities: [
    { city: 'Vilnius', price: 4314 },
    { city: 'Kaunas', price: 3046 },
    { city: 'Klaipėda', price: 2776 },
    { city: 'Panevėžys', price: 1835 },
    { city: 'Šiauliai', price: 1804 },
    { city: 'Alytus', price: 1546 },
  ],
}
