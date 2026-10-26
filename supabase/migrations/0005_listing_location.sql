-- Skelbimo vieta žemėlapyje. Skelbėjas ją pažymi formoje, o jei nepažymi, serveris nustato pagal adresą.
-- Koordinatės ribojamos Lietuvos teritorija (su nedidele atsarga). Migracija kartojama saugiai.
alter table public.listings
  add column if not exists lat double precision check (lat between 53.8 and 56.5),
  add column if not exists lng double precision check (lng between 20.9 and 26.9);

create index if not exists listings_geo_idx on public.listings (deal, type) where lat is not null;
