-- Išsami paieška: filtras „ne paskutinis aukštas“ ir rikiavimas pagal įdėjimo datą.
-- Migracija kartojama saugiai (if not exists).

alter table public.listings add column if not exists floor_is_last boolean
  generated always as (floor is not null and floors is not null and floor >= floors) stored;

create index if not exists listings_published_idx on public.listings (published_at desc);

-- PostgREST iš karto pamato naują stulpelį.
notify pgrst, 'reload schema';
