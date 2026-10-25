-- Slenkstis: duomenų bazės schema.
-- Paleiskite visą failą Supabase → SQL Editor (arba `supabase db push`).
-- Saugumo principas: skelbimus mato visi, bet kurti, keisti ir trinti gali tik jų savininkas.
-- Tai tikrina pati duomenų bazė (Row Level Security), ne naršyklė.

-- =====================================================================
-- Profiliai
-- =====================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 80),
  phone text check (phone is null or phone ~ '^\+?[0-9 ()-]{8,20}$'),
  seller_kind text not null default 'private' check (seller_kind in ('private', 'agency')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: savininkas skaito" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: savininkas sukuria" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles: savininkas keičia" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Prisijungus pirmą kartą per Google automatiškai sukuriamas profilis.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 80));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.profiles_touch() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.id := old.id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.profiles_touch();

-- =====================================================================
-- Skelbimai
-- =====================================================================
-- Būsenos: draft (juodraštis), active (aktyvus), paused (pristabdytas),
-- closed (parduotas / išnuomotas). Aktyvus skelbimas matomas iki expires_at.
create table public.listings (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'closed')),
  deal text not null check (deal in ('sale', 'rent')),
  type text not null check (type in ('butas', 'namas', 'sklypas', 'patalpos', 'garazas')),
  city text not null check (char_length(city) between 1 and 80),
  district text not null check (char_length(district) between 1 and 80),
  street text not null check (char_length(street) between 1 and 120),
  price numeric(12, 2) not null check (price > 0 and price < 100000000),
  old_price numeric(12, 2),
  area numeric(10, 2) not null check (area > 0 and area < 1000000),
  rooms smallint check (rooms between 1 and 50),
  floor smallint check (floor between -5 and 200),
  floors smallint check (floors between 1 and 200),
  plot numeric(10, 2) check (plot > 0),
  year smallint check (year between 1500 and 2100),
  building text check (char_length(building) <= 40),
  heating text check (char_length(heating) <= 60),
  finish text check (char_length(finish) <= 40),
  energy text check (energy in ('A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G')),
  purpose text check (char_length(purpose) <= 40),
  features text[] not null default '{}' check (cardinality(features) <= 20),
  description text not null default '' check (char_length(description) <= 5000),
  contact_name text not null check (char_length(contact_name) between 1 and 80),
  contact_phone text not null check (contact_phone ~ '^\+?[0-9 ()-]{8,20}$'),
  -- Sklypų plotas saugomas arais, kitų objektų – m². area_m2 leidžia lyginti visus kartu.
  area_m2 numeric generated always as (case when type = 'sklypas' then area * 100 else area end) stored,
  price_per_unit numeric generated always as (round(price / area, 2)) stored,
  search_text text not null default '',
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_public_idx on public.listings (deal, type, status, expires_at);
create index listings_owner_idx on public.listings (owner_id, updated_at desc);
create index listings_location_idx on public.listings (city, district);

-- Laukai, kurių savininkas negali nustatyti pats (savininkas, datos, ankstesnė kaina),
-- tvarkomi čia, todėl jų neįmanoma suklastoti net tiesiogiai kreipiantis į API.
create function public.listings_before_write() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (select count(*) from public.listings where owner_id = auth.uid()) >= 50 then
      raise exception 'Pasiektas skelbimų limitas: vienas naudotojas gali turėti iki 50 skelbimų.'
        using errcode = 'P0001';
    end if;
    new.owner_id := auth.uid();
    new.old_price := null;
    new.created_at := now();
    new.published_at := null;
    new.expires_at := null;
  else
    new.owner_id := old.owner_id;
    new.created_at := old.created_at;
    new.published_at := old.published_at;
    -- Sumažinus kainą prisimenama ankstesnė, kad būtų galima rodyti „Kaina sumažinta“.
    if new.price < old.price then
      new.old_price := greatest(old.price, coalesce(old.old_price, 0));
    elsif new.price >= coalesce(old.old_price, 0) then
      new.old_price := null;
    else
      new.old_price := old.old_price;
    end if;
    -- Galiojimą galima pratęsti daugiausia 60 dienų nuo šiandien.
    if new.expires_at is distinct from old.expires_at then
      new.expires_at := least(new.expires_at, now() + interval '60 days');
    end if;
  end if;

  -- Paskelbus (arba vėl aktyvavus) skelbimas galioja 60 dienų.
  if new.status = 'active' and (tg_op = 'INSERT' or old.status <> 'active') then
    new.published_at := coalesce(new.published_at, now());
    new.expires_at := now() + interval '60 days';
  end if;

  new.updated_at := now();
  new.search_text := translate(
    lower(concat_ws(' ', new.city, new.district, new.street, new.purpose, new.description,
                    array_to_string(new.features, ' '))),
    'ąčęėįšųūž', 'aceeisuuz');
  return new;
end;
$$;

create trigger listings_before_write
  before insert or update on public.listings
  for each row execute function public.listings_before_write();

alter table public.listings enable row level security;

create policy "listings: aktyvūs matomi visiems" on public.listings
  for select to anon, authenticated using (status = 'active' and expires_at > now());
create policy "listings: savininkas mato savo" on public.listings
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "listings: savininkas kuria" on public.listings
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "listings: savininkas keičia" on public.listings
  for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "listings: savininkas trina" on public.listings
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- =====================================================================
-- Kainų istorija (pildoma automatiškai)
-- =====================================================================
create table public.price_history (
  id bigint generated always as identity primary key,
  listing_id bigint not null references public.listings (id) on delete cascade,
  price numeric(12, 2) not null,
  changed_at timestamptz not null default now()
);

create index price_history_listing_idx on public.price_history (listing_id, changed_at);

alter table public.price_history enable row level security;

create policy "price_history: matoma kartu su skelbimu" on public.price_history
  for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id));

create function public.listings_log_price() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.price is distinct from old.price then
    insert into public.price_history (listing_id, price) values (new.id, new.price);
  end if;
  return null;
end;
$$;

create trigger listings_log_price
  after insert or update of price on public.listings
  for each row execute function public.listings_log_price();

-- =====================================================================
-- Nuotraukos
-- =====================================================================
create table public.listing_photos (
  id bigint generated always as identity primary key,
  listing_id bigint not null references public.listings (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  path text not null unique check (char_length(path) <= 300),
  position smallint not null default 0 check (position between 0 and 49),
  created_at timestamptz not null default now()
);

create index listing_photos_listing_idx on public.listing_photos (listing_id, position);

create function public.listing_photos_guard() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (select count(*) from public.listing_photos where listing_id = new.listing_id) >= 20 then
      raise exception 'Vienam skelbimui galima įkelti iki 20 nuotraukų.' using errcode = 'P0001';
    end if;
    new.owner_id := auth.uid();
  else
    new.listing_id := old.listing_id;
    new.owner_id := old.owner_id;
    new.path := old.path;
  end if;
  return new;
end;
$$;

create trigger listing_photos_guard
  before insert or update on public.listing_photos
  for each row execute function public.listing_photos_guard();

alter table public.listing_photos enable row level security;

create policy "photos: matomos kartu su skelbimu" on public.listing_photos
  for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id));
create policy "photos: savininkas prideda" on public.listing_photos
  for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and path like (select auth.uid())::text || '/%'
    and exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
  );
create policy "photos: savininkas keičia" on public.listing_photos
  for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "photos: savininkas trina" on public.listing_photos
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- Nuotraukų saugykla: viešai skaitoma, bet kiekvienas rašo tik į savo aplanką <user_id>/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "listing-photos: įkelia į savo aplanką" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "listing-photos: mato savo" on storage.objects
  for select to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "listing-photos: trina savo" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- =====================================================================
-- Funkcijos svetainei (vykdomos lankytojo teisėmis, todėl galioja RLS)
-- =====================================================================
create function public.listing_type_counts(p_deal text)
returns table (type text, n bigint)
language sql stable set search_path = ''
as $$
  select l.type, count(*)
  from public.listings l
  where l.status = 'active' and l.expires_at > now() and l.deal = p_deal
  group by l.type;
$$;

create function public.listing_locations()
returns table (city text, district text)
language sql stable set search_path = ''
as $$
  select distinct l.city, l.district
  from public.listings l
  where l.status = 'active' and l.expires_at > now()
  order by 1, 2;
$$;

create function public.city_price_stats()
returns table (city text, avg_price_m2 numeric, n bigint)
language sql stable set search_path = ''
as $$
  select l.city, round(sum(l.price) / sum(l.area)), count(*)
  from public.listings l
  where l.status = 'active' and l.expires_at > now() and l.deal = 'sale' and l.type = 'butas'
  group by l.city
  order by 2 desc;
$$;

-- Paskyros ištrynimas (BDAR teisė būti pamirštam). Kartu ištrinami profilis,
-- skelbimai ir nuotraukų įrašai; pačius nuotraukų failus prieš tai ištrina svetainė.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Neprisijungta.';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- =====================================================================
-- Teisės (Data API)
-- =====================================================================
grant select on public.listings, public.listing_photos, public.price_history to anon, authenticated;
grant insert, update, delete on public.listings, public.listing_photos to authenticated;
grant select, insert, update on public.profiles to authenticated;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
grant execute on function public.listing_type_counts(text), public.listing_locations(), public.city_price_stats()
  to anon, authenticated;
