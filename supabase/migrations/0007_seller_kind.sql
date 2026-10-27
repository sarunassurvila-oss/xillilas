-- Skelbėjo tipas: privatus asmuo arba įmonė (juridinis asmuo).
-- Privataus asmens vardas skelbime viešai nerodomas ir jame nesaugomas (vietoj jo „Privatus asmuo“),
-- įmonės skelbime rodomas pavadinimas ir logotipas. Reikšmės imamos iš profilio, todėl jų negalima suklastoti.
-- Migracija kartojama saugiai.

alter table public.profiles
  add column if not exists logo_path text;
alter table public.profiles drop constraint if exists profiles_logo_path_check;
-- Logotipas gali būti tik paties naudotojo aplanke (kitaip būtų galima rodyti svetimą logotipą).
alter table public.profiles add constraint profiles_logo_path_check
  check (logo_path is null or (char_length(logo_path) <= 200 and split_part(logo_path, '/', 1) = id::text));

alter table public.listings
  add column if not exists seller_kind text not null default 'private' check (seller_kind in ('private', 'agency')),
  add column if not exists seller_logo text;

-- Paleidžiama po listings_before_write (trigeriai vykdomi pagal pavadinimą), kai savininkas jau nustatytas.
create or replace function public.listings_set_seller() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  kind text;
  logo text;
begin
  select p.seller_kind, p.logo_path into kind, logo from public.profiles p where p.id = new.owner_id;
  new.seller_kind := coalesce(kind, 'private');
  if new.seller_kind = 'private' then
    new.contact_name := 'Privatus asmuo';
    new.seller_logo := null;
  else
    new.seller_logo := logo;
  end if;
  return new;
end;
$$;
drop trigger if exists listings_set_seller on public.listings;
create trigger listings_set_seller before insert or update on public.listings
  for each row execute function public.listings_set_seller();

-- Pakeitus profilio tipą ar logotipą, atnaujinami visi naudotojo skelbimai.
create or replace function public.profiles_sync_listings() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.seller_kind is distinct from old.seller_kind or new.logo_path is distinct from old.logo_path then
    update public.listings
       set contact_name = case
             when new.seller_kind = 'agency' and old.seller_kind <> 'agency' then coalesce(nullif(new.full_name, ''), contact_name)
             else contact_name end
     where owner_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_sync_listings on public.profiles;
create trigger profiles_sync_listings after update on public.profiles
  for each row execute function public.profiles_sync_listings();

-- Registruojantis el. paštu pasirinktas tipas ateina naudotojo metaduomenyse.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, seller_kind)
  values (new.id,
          left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 80),
          case when new.raw_user_meta_data ->> 'seller_kind' = 'agency' then 'agency' else 'private' end);
  return new;
end;
$$;

-- Esami skelbimai: tik tie, kurie dar nesutampa su profiliu (kad kartojant nebūtų keičiama be reikalo).
update public.listings l set seller_kind = l.seller_kind
  from public.profiles p
 where p.id = l.owner_id
   and (l.seller_kind <> p.seller_kind
        or (p.seller_kind = 'private' and l.contact_name <> 'Privatus asmuo')
        or l.seller_logo is distinct from (case when p.seller_kind = 'agency' then p.logo_path end));

-- Logotipų saugykla: vieša peržiūra, įkelti ir trinti – tik savo aplanke.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('seller-logos', 'seller-logos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "seller-logos: įkelia į savo aplanką" on storage.objects;
drop policy if exists "seller-logos: mato savo" on storage.objects;
drop policy if exists "seller-logos: trina savo" on storage.objects;
create policy "seller-logos: įkelia į savo aplanką" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'seller-logos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "seller-logos: mato savo" on storage.objects
  for select to authenticated
  using (bucket_id = 'seller-logos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "seller-logos: trina savo" on storage.objects
  for delete to authenticated
  using (bucket_id = 'seller-logos' and (storage.foldername(name))[1] = (select auth.uid())::text);
