// Prieš paleidžiant svetainę viešai, įrašykite tikrus įmonės duomenis.
export const SITE = {
  name: 'bustas.lt',
  // Tikras adresas: Vercel → Settings → Environment Variables → NEXT_PUBLIC_SITE_URL (pvz. https://bustas.lt).
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://xillilas.vercel.app').replace(/\/$/, ''),
  description: 'Nekilnojamojo turto skelbimai: butai, namai, sklypai, patalpos ir garažai pardavimui bei nuomai visoje Lietuvoje.',
  company: '[Įmonės pavadinimas]',
  companyCode: '[įmonės kodas]',
  address: '[buveinės adresas]',
  email: '[kontaktinis el. paštas]',
  listingDays: 60,
}
