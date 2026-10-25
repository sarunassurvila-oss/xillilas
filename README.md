# bustas.lt

Nekilnojamojo turto skelbimų svetainė: butai, namai, sklypai, patalpos ir garažai pardavimui bei nuomai. Skelbėjai prisijungia su **Google** paskyra (be slaptažodžių) ir patys tvarko savo skelbimus.

**Technologijos:** Next.js 16 (App Router), Supabase (PostgreSQL, Auth, Storage), talpinimas Vercel.

## Kas veikia

**Lankytojams**
- Paieška pagal sandorio tipą, kategoriją, miestą, mikrorajoną, kainą, plotą, kambarių skaičių ir žodį (veikia ir be lietuviškų raidžių: „zirmunu“ randa „Žirmūnų“).
- Rūšiavimas, puslapiavimas, kategorijų skaičiai, butų kainos už m² pagal miestus.
- Skelbimo puslapis: nuotraukų galerija, visos savybės, telefono numeris rodomas tik paspaudus, būsto paskolos skaičiuoklė, panašūs skelbimai.

**Skelbėjams** (`/mano`)
- Prisijungimas per Google vienu paspaudimu. Po prisijungimo naudotojas grąžinamas ten, kur ėjo (pvz. į naujo skelbimo formą).
- Skelbimo kūrimas ir redagavimas, juodraščiai, paskelbimas.
- Iki 20 nuotraukų: tempimas į formą, rikiavimas, pagrindinės nuotraukos pasirinkimas. Nuotraukos naršyklėje automatiškai sumažinamos iki 1600 px.
- Būsenos: Juodraštis → Aktyvus (60 d.) → Pasibaigęs / Pristabdytas / Parduotas ar Išnuomotas. Pratęsimas vienu paspaudimu.
- Sumažinus kainą automatiškai rodoma žyma „Kaina sumažinta“, kainų istorija saugoma.
- Profilis: vardas, telefonas, skelbėjo tipas (įrašomi į naujus skelbimus). Paskyros ištrynimas kartu su visais duomenimis (BDAR).

## Saugumas

Taisykles tikrina pati duomenų bazė (Row Level Security), todėl jų neapeisi ir kreipdamasis tiesiai į API.

- Aktyvius ir galiojančius skelbimus mato visi. Juodraščius, pristabdytus ir pasibaigusius mato tik savininkas.
- Kurti, keisti ir trinti skelbimą gali tik jo savininkas. Savininko pakeisti negalima.
- Galiojimą galima pratęsti daugiausia 60 dienų nuo šiandien; ankstesnę kainą ir kainų istoriją pildo duomenų bazė, ne naršyklė.
- Nuotraukos keliamos tik į savo aplanką `listing-photos/<naudotojo id>/...`.
- Ribos: iki 50 skelbimų vienam naudotojui, iki 20 nuotraukų skelbimui, iki 5 MB vienam failui.

Schema ir visos taisyklės: [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

---

## Paleidimas žingsnis po žingsnio

Jums reikės: Supabase paskyros, Google paskyros ir Vercel paskyros. Pradžiai visos trys gali būti nemokamos.

Toliau `<ref>` yra jūsų Supabase projekto ID (matosi adrese `https://<ref>.supabase.co`), o `jusu-domenas.lt` jūsų svetainės domenas.

### 1. Supabase projektas

1. [supabase.com](https://supabase.com) → **New project**. Regionas: **Central EU (Frankfurt)** arba **North EU (Stockholm)**.
2. **SQL Editor** → **New query** → įklijuokite visą `supabase/migrations/0001_init.sql` turinį → **Run**.
3. **Connect** mygtukas (arba Project Settings → API Keys): nukopijuokite **Project URL** ir **Publishable key**.
4. Projekto aplanke:
   ```bash
   cp .env.example .env.local
   ```
   ir įrašykite šias dvi reikšmes.

### 2. Kur leidžiama grįžti po prisijungimo

Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** `https://jusu-domenas.lt` (kol domeno nėra, `http://localhost:3000`)
- **Redirect URLs** (pridėkite visus):
  - `http://localhost:3000/auth/callback`
  - `https://jusu-domenas.lt/auth/callback`
  - `https://*-<jusu-vercel-komanda>.vercel.app/auth/callback` (Vercel peržiūros versijoms)

### 3. Prisijungimas su Google

1. [console.cloud.google.com](https://console.cloud.google.com) → sukurkite naują projektą „bustas.lt“.
2. **Google Auth Platform** → **Branding**:
   - App name: `bustas.lt`, User support email: jūsų el. paštas
   - Application home page: `https://jusu-domenas.lt`
   - Privacy policy: `https://jusu-domenas.lt/privatumas`, Terms of service: `https://jusu-domenas.lt/taisykles`
   - Authorized domains: `jusu-domenas.lt` ir `supabase.co`
3. **Audience** → User type **External** → **Publish app**. Naudojami tik `openid`, `email`, `profile` leidimai, jiems papildomos Google patikros nereikia.
4. **Clients** → **Create client** → Application type **Web application**:
   - Authorized JavaScript origins: `https://jusu-domenas.lt`, `http://localhost:3000`
   - Authorized redirect URIs: `https://<ref>.supabase.co/auth/v1/callback`
5. Nukopijuokite **Client ID** ir **Client secret** → Supabase → **Authentication** → **Sign In / Providers** → **Google** → įjunkite, įklijuokite → **Save**.

> Google lange bus parašyta „tęsti į <ref>.supabase.co“. Kad būtų rodomas jūsų domenas, Supabase → **Custom Domains** (mokamas priedas) nustatykite, pvz., `auth.jusu-domenas.lt`.

### 4. Paleidimas savo kompiuteryje

```bash
npm install
npm run dev
```

Atidarykite [http://localhost:3000](http://localhost:3000). Prisijungimas per Google veikia ir čia, nes grįžimo adresas `http://localhost:3000/auth/callback` pridėtas 2 žingsnyje.

### 5. Paskelbimas internete (Vercel)

1. Įkelkite projektą į GitHub.
2. [vercel.com](https://vercel.com) → **Add New** → **Project** → pasirinkite repozitoriją.
3. **Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL` ir `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → **Deploy**.
4. **Settings** → **Domains** → pridėkite `jusu-domenas.lt` ir pas domeno registratorių nustatykite Vercel nurodytus DNS įrašus.
5. Supabase (2 žingsnis) ir Google (3 žingsnis) nustatymuose patikrinkite, kad įrašytas tikras domenas.

### Prieš atidarant svetainę visiems

- [ ] `src/lib/site.ts` įrašykite įmonės pavadinimą, kodą, adresą ir el. paštą (rodomi privatumo politikoje ir taisyklėse).
- [ ] Privatumo politiką (`/privatumas`) ir taisykles (`/taisykles`) peržiūrėkite su teisininku.
- [ ] Supabase **Pro** planas: nemokamas projektas sustabdomas po savaitės neveiklumo ir neturi kasdienių atsarginių kopijų.
- [ ] Supabase → Authentication → **Attack Protection**: įjunkite CAPTCHA, jei atsiras netikrų paskyrų.

---

## Vietinė Supabase (nebūtina)

Jei turite Docker, visą Supabase galima paleisti savo kompiuteryje. Schema pritaikoma automatiškai.

```bash
npx supabase start
```

Komanda parodys vietinį `API URL` ir `Publishable key`: įrašykite juos į `.env.local`. Google prisijungimui vietinėje Supabase žr. `supabase/config.toml`.

## Projekto struktūra

```
src/
  proxy.ts                    sesijos atnaujinimas, /mano apsauga
  app/
    page.tsx                  paieška ir skelbimų sąrašas
    skelbimas/[id]/           skelbimo puslapis
    prisijungti/              prisijungimas su Google
    auth/callback, signout/   prisijungimo grąžinimas, atsijungimas
    mano/                     mano skelbimai, naujas, redagavimas, profilis
    mano/actions.ts           serverio veiksmai (saugojimas, būsenos, trynimas)
  components/                 forma su nuotraukomis, galerija, paskolos skaičiuoklė ir kt.
  lib/                        Supabase klientai, filtrai, tekstai, tikrinimas
supabase/migrations/          duomenų bazės schema ir saugumo taisyklės
```

## Kiti etapai

- Telefono patvirtinimas SMS kodu prieš pirmą skelbimą (Supabase Phone Auth + Twilio ar Vonage).
- Moderavimas: naujų skelbimų tikrinimas ir administratoriaus skydelis.
- Priminimai el. paštu prieš pasibaigiant skelbimui (Supabase Cron + Resend).
- Statistika skelbėjui: peržiūros, telefono atskleidimai.
- Įsiminti skelbimai paskyroje, pirkėjų žinutės.
- Mokami iškėlimai (Paysera, Montonio ar Stripe), agentūrų paskyros, XML importas.
