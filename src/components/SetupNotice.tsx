export function SetupNotice() {
  return (
    <div className="wrap">
      <div className="panel setup">
        <h1 style={{ margin: 0, font: '700 24px var(--font-display)' }}>Supabase dar neprijungtas</h1>
        <p>Svetainė veikia, bet nežino, prie kurios duomenų bazės jungtis.</p>
        <ol>
          <li>Nukopijuokite <code>.env.example</code> į <code>.env.local</code>.</li>
          <li>Įrašykite Supabase projekto <code>NEXT_PUBLIC_SUPABASE_URL</code> ir <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>.</li>
          <li>Paleiskite <code>supabase/migrations/0001_init.sql</code> Supabase SQL Editor&apos;iuje.</li>
          <li>Iš naujo paleiskite <code>npm run dev</code>.</li>
        </ol>
        <p>Visas žingsnis po žingsnio aprašymas yra faile <code>README.md</code>.</p>
      </div>
    </div>
  )
}
