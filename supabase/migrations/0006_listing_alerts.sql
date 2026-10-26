-- Prenumeratos: naudotojas išsaugo paieškos filtrus ir gauna laišką, kai paskelbiamas tinkantis skelbimas.
--
-- Eiga: paskelbus skelbimą jis įrašomas į listing_alert_queue. Kas minutę (pg_cron) process_listing_alerts()
-- po ~3 min. (kad spėtų įsikelti nuotraukos) suranda tinkančias prenumeratas, įrašo laiškus į alert_outbox ir
-- siunčia juos per Brevo API (pg_net). Brevo raktas, siuntėjas ir adresai laikomi Supabase Vault.
-- Migracija kartojama saugiai.

-- ---------------------------------------------------------------------------
-- Prenumeratos
-- ---------------------------------------------------------------------------
create table if not exists public.saved_searches (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Filtrai, pagal kuriuos tikrinami nauji skelbimai (žr. search_matches) ...
  criteria jsonb not null check (jsonb_typeof(criteria) = 'object'),
  -- ... ir ta pati paieška kaip svetainės adresas („Atidaryti paiešką“).
  query text not null check (char_length(query) <= 2000),
  label text not null check (char_length(label) between 1 and 300),
  active boolean not null default true,
  token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  last_sent_at timestamptz,
  unique (owner_id, query)
);
create index if not exists saved_searches_active_idx on public.saved_searches (active) where active;

alter table public.saved_searches enable row level security;
drop policy if exists "saved_searches: savininkas skaito" on public.saved_searches;
drop policy if exists "saved_searches: savininkas sukuria" on public.saved_searches;
drop policy if exists "saved_searches: savininkas keičia" on public.saved_searches;
drop policy if exists "saved_searches: savininkas trina" on public.saved_searches;
create policy "saved_searches: savininkas skaito" on public.saved_searches
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "saved_searches: savininkas sukuria" on public.saved_searches
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "saved_searches: savininkas keičia" on public.saved_searches
  for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "saved_searches: savininkas trina" on public.saved_searches
  for delete to authenticated using ((select auth.uid()) = owner_id);
grant select, insert, delete on public.saved_searches to authenticated;
grant update (active, label) on public.saved_searches to authenticated;

-- Iki 20 prenumeratų vienam naudotojui; savininkas, žetonas ir datos nustatomi čia.
create or replace function public.saved_searches_before_insert() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (select count(*) from public.saved_searches where owner_id = auth.uid()) >= 20 then
    raise exception 'Galima turėti iki 20 prenumeratų. Ištrinkite nebereikalingas.' using errcode = 'P0001';
  end if;
  new.owner_id := auth.uid();
  new.token := gen_random_uuid();
  new.created_at := now();
  new.last_sent_at := null;
  return new;
end;
$$;
drop trigger if exists saved_searches_before_insert on public.saved_searches;
create trigger saved_searches_before_insert before insert on public.saved_searches
  for each row execute function public.saved_searches_before_insert();

-- Atsisakymas pagal nuorodą laiške (be prisijungimo).
create or replace function public.unsubscribe_saved_search(p_token uuid) returns text
language sql security definer set search_path = ''
as $$
  update public.saved_searches set active = false where token = p_token returning label
$$;
revoke all on function public.unsubscribe_saved_search(uuid) from public;
grant execute on function public.unsubscribe_saved_search(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Ar skelbimas atitinka prenumeratos filtrus (tos pačios taisyklės kaip paieškoje, src/app/page.tsx).
-- Raktai, kurių nėra, filtro neriboja.
-- ---------------------------------------------------------------------------
create or replace function public.search_matches(l public.listings, c jsonb) returns boolean
language sql stable set search_path = ''
as $$
  select
    l.deal = coalesce(c ->> 'deal', 'sale')
    and (c ->> 'type' is null or l.type = c ->> 'type')
    and (c ->> 'city' is null or l.city = c ->> 'city')
    and (c -> 'districts' is null or l.district in (select jsonb_array_elements_text(c -> 'districts')))
    and (c ->> 'pmin' is null or l.price >= (c ->> 'pmin')::numeric)
    and (c ->> 'pmax' is null or l.price <= (c ->> 'pmax')::numeric)
    and (c ->> 'amin' is null or (case when c ->> 'type' = 'sklypas' then l.area else l.area_m2 end) >= (c ->> 'amin')::numeric)
    and (c ->> 'amax' is null or (case when c ->> 'type' = 'sklypas' then l.area else l.area_m2 end) <= (c ->> 'amax')::numeric)
    and (c -> 'rooms' is null
      or l.rooms in (select (x)::smallint from jsonb_array_elements_text(c -> 'rooms') x where x::int < 5)
      or (c -> 'rooms' @> '[5]' and l.rooms >= 5))
    and (c -> 'words' is null or not exists (
      select 1 from jsonb_array_elements_text(c -> 'words') w where l.search_text not like '%' || w || '%'))
    and (c ->> 'fmin' is null or l.floor >= (c ->> 'fmin')::numeric)
    and (c ->> 'fmax' is null or l.floor <= (c ->> 'fmax')::numeric)
    and (not coalesce((c ->> 'notFirst')::boolean, false) or l.floor > 1)
    and (not coalesce((c ->> 'notLast')::boolean, false) or l.floor_is_last = false)
    and (c ->> 'ymin' is null or l.year >= (c ->> 'ymin')::numeric)
    and (c ->> 'ymax' is null or l.year <= (c ->> 'ymax')::numeric)
    and (c ->> 'plmin' is null or l.plot >= (c ->> 'plmin')::numeric)
    and (c ->> 'plmax' is null or l.plot <= (c ->> 'plmax')::numeric)
    and (c ->> 'umin' is null or l.price_per_unit >= (c ->> 'umin')::numeric)
    and (c ->> 'umax' is null or l.price_per_unit <= (c ->> 'umax')::numeric)
    and (c -> 'building' is null or l.building in (select jsonb_array_elements_text(c -> 'building')))
    and (c -> 'heating' is null or l.heating in (select jsonb_array_elements_text(c -> 'heating')))
    and (c -> 'finish' is null or l.finish in (select jsonb_array_elements_text(c -> 'finish')))
    and (c ->> 'energy' is null or l.energy = c ->> 'energy')
    and (c ->> 'purpose' is null or l.purpose = c ->> 'purpose')
    and (c -> 'features' is null or l.features @> array(select jsonb_array_elements_text(c -> 'features')))
    and (not coalesce((c ->> 'photos')::boolean, false) or exists (select 1 from public.listing_photos p where p.listing_id = l.id))
$$;

-- ---------------------------------------------------------------------------
-- Eilė ir siunčiami laiškai (tik serveriui: RLS be taisyklių, todėl iš naršyklės nepasiekiami)
-- ---------------------------------------------------------------------------
create table if not exists public.listing_alert_queue (
  listing_id bigint primary key references public.listings (id) on delete cascade,
  queued_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.listing_alert_queue enable row level security;

create table if not exists public.alert_outbox (
  id bigint generated always as identity primary key,
  saved_search_id bigint not null references public.saved_searches (id) on delete cascade,
  listing_id bigint not null references public.listings (id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts smallint not null default 0,
  request_id bigint,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (saved_search_id, listing_id)
);
create index if not exists alert_outbox_status_idx on public.alert_outbox (status, id);
create unique index if not exists alert_outbox_listing_email_idx on public.alert_outbox (listing_id, email);
alter table public.alert_outbox enable row level security;

-- Pirmą kartą paskelbtas skelbimas patenka į eilę (vėl aktyvuotas – ne).
create or replace function public.listings_queue_alert() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'active' and new.published_at is not null and (tg_op = 'INSERT' or old.published_at is null) then
    insert into public.listing_alert_queue (listing_id) values (new.id) on conflict do nothing;
  end if;
  return null;
end;
$$;
drop trigger if exists listings_queue_alert on public.listings;
create trigger listings_queue_alert after insert or update of status on public.listings
  for each row execute function public.listings_queue_alert();

-- ---------------------------------------------------------------------------
-- Laiško turinys
-- ---------------------------------------------------------------------------
create or replace function public.html_escape(t text) returns text
language sql immutable set search_path = ''
as $$ select replace(replace(replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;'), '''', '&#39;') $$;

-- 189000 → „189 000“
create or replace function public.lt_number(n numeric) returns text
language sql immutable set search_path = ''
as $$ select regexp_replace(round(n)::text, '(\d)(?=(\d{3})+$)', '\1 ', 'g') $$;

-- Tas pats pavadinimas kaip svetainėje (src/lib/listings.ts: titleOf, sizeOf).
create or replace function public.listing_title(l public.listings) returns text
language sql immutable set search_path = ''
as $$
  select case l.type
      when 'butas' then case when l.rooms is not null then l.rooms || ' kamb. butas' else 'Butas' end
      when 'namas' then case l.floors when 1 then 'Vieno aukšto' when 2 then 'Dviejų aukštų' when 3 then 'Trijų aukštų' else 'Gyvenamasis' end || ' namas'
      when 'sklypas' then coalesce(l.purpose, 'Namų valdos') || ' sklypas'
      when 'patalpos' then coalesce(l.purpose, 'Komercinės') || ' patalpos'
      else 'Garažas'
    end
    || ', ' || replace(trim(trailing '.' from trim(trailing '0' from round(l.area, 1)::text)), '.', ',')
    || case when l.type = 'sklypas' then ' a' else ' m²' end
$$;

create or replace function public.alert_secret(p_name text) returns text
language sql stable security definer set search_path = ''
as $$ select decrypted_secret from vault.decrypted_secrets where name = p_name limit 1 $$;
revoke all on function public.alert_secret(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Kas minutę: patikrinti eilę ir išsiųsti laiškus
-- ---------------------------------------------------------------------------
create or replace function public.process_listing_alerts() returns void
language plpgsql security definer set search_path = ''
as $$
declare
  api_key text := public.alert_secret('brevo_api_key');
  sender text := public.alert_secret('alerts_sender');
  site text := coalesce(public.alert_secret('site_url'), 'https://xillilas.vercel.app');
  photos text := public.alert_secret('photos_url');
  q record;
  o record;
  lst public.listings;
  price text;
  html text;
  req bigint;
begin
  -- 1. Ankstesnių siuntimų rezultatai (pg_net atsakymai); nepavykę bandomi dar iki 3 kartų.
  update public.alert_outbox ao
     set status = case when r.status_code between 200 and 299 then 'sent'
                       when ao.attempts < 3 then 'pending' else 'failed' end,
         sent_at = case when r.status_code between 200 and 299 then now() end,
         error = case when r.status_code between 200 and 299 then null
                      else left(coalesce(r.status_code::text || ' ' || r.content, r.error_msg, 'timeout'), 300) end
    from net._http_response r
   where r.id = ao.request_id and ao.status = 'sending';
  update public.alert_outbox set status = 'pending'
   where status = 'sending' and created_at < now() - interval '30 minutes' and attempts < 3;

  -- 2. Skelbimai, paskelbti prieš ≥ 3 min. → tinkančios prenumeratos.
  for q in select listing_id from public.listing_alert_queue
            where processed_at is null and queued_at < now() - interval '3 minutes'
            order by queued_at limit 100 loop
    -- Vienas laiškas žmogui apie skelbimą, net jei tinka kelios jo prenumeratos.
    insert into public.alert_outbox (saved_search_id, listing_id, email)
    select distinct on (s.owner_id) s.id, l.id, u.email
      from public.listings l
      join public.saved_searches s on s.active
      join auth.users u on u.id = s.owner_id
     where l.id = q.listing_id
       and l.status = 'active' and l.expires_at > now()
       and s.owner_id <> l.owner_id
       and u.email is not null
       and public.search_matches(l, s.criteria)
     order by s.owner_id, s.id
    on conflict do nothing;
    update public.listing_alert_queue set processed_at = now() where listing_id = q.listing_id;
  end loop;

  -- 3. Siuntimas (kol nėra Brevo rakto, laiškai laukia; senesni nei parą – nebesiunčiami).
  update public.alert_outbox set status = 'skipped', error = 'per senas'
   where status = 'pending' and created_at < now() - interval '1 day';
  if api_key is null or sender is null then
    return;
  end if;

  for o in
    select ao.id, ao.email, ao.attempts, ao.listing_id, s.label, s.token, s.query
      from public.alert_outbox ao
      join public.saved_searches s on s.id = ao.saved_search_id
      join public.listings x on x.id = ao.listing_id
     where ao.status = 'pending' and s.active and x.status = 'active'
     order by ao.id
     limit 40
  loop
    select * into lst from public.listings where id = o.listing_id;
    -- Apsauga nuo per didelio kiekio: vienam adresui iki 30 laiškų per parą.
    if (select count(*) from public.alert_outbox x
         where x.email = o.email and x.status in ('sending', 'sent') and x.created_at > now() - interval '1 day') >= 30 then
      update public.alert_outbox set status = 'skipped', error = 'dienos riba' where id = o.id;
      continue;
    end if;

    price := public.lt_number(lst.price) || case when lst.deal = 'rent' then ' €/mėn.' else ' €' end;
    html :=
      '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#2b1d14">'
      || '<p style="font-size:14px;color:#7a6455;margin:0 0 12px">Naujas skelbimas pagal jūsų prenumeratą: <b>'
      || public.html_escape(o.label) || '</b></p>'
      || '<a href="' || site || '/skelbimas/' || lst.id || '" style="display:block;text-decoration:none;color:#2b1d14;border:1px solid #eadfce;border-radius:12px;overflow:hidden">'
      || coalesce((select '<img src="' || photos || p.path || '" alt="" width="560" style="display:block;width:100%;max-height:320px;object-fit:cover">'
                     from public.listing_photos p where p.listing_id = lst.id and photos is not null order by p.position limit 1), '')
      || '<div style="padding:14px 16px">'
      || '<div style="font-size:22px;font-weight:bold">' || price || '</div>'
      || '<div style="font-size:16px;font-weight:bold;margin-top:4px">' || public.html_escape(public.listing_title(lst)) || '</div>'
      || '<div style="font-size:14px;color:#7a6455;margin-top:4px">' || public.html_escape(concat_ws(', ', lst.city, lst.district, lst.street)) || '</div>'
      || '</div></a>'
      || '<p style="margin:18px 0"><a href="' || site || '/skelbimas/' || lst.id || '" style="background:#e8a33d;color:#2b1d14;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Žiūrėti skelbimą</a></p>'
      || '<p style="font-size:13px;color:#7a6455">Visi skelbimai pagal šią paiešką: <a href="' || site || '/?' || public.html_escape(o.query) || '#rezultatai" style="color:#8a5a1f">atidaryti paiešką</a></p>'
      || '<hr style="border:0;border-top:1px solid #eadfce;margin:20px 0">'
      || '<p style="font-size:12px;color:#9a8676">Šį laišką gavote, nes užsiprenumeravote naujus skelbimus svetainėje bustas.lt. '
      || '<a href="' || site || '/prenumerata/atsisakyti?t=' || o.token || '" style="color:#9a8676">Atsisakyti šios prenumeratos</a> · '
      || '<a href="' || site || '/mano/prenumeratos" style="color:#9a8676">Visos prenumeratos</a></p>'
      || '</div>';

    select net.http_post(
      url := 'https://api.brevo.com/v3/smtp/email',
      headers := jsonb_build_object('api-key', api_key, 'content-type', 'application/json', 'accept', 'application/json'),
      body := jsonb_build_object(
        'sender', jsonb_build_object('name', 'bustas.lt', 'email', sender),
        'to', jsonb_build_array(jsonb_build_object('email', o.email)),
        'subject', 'Naujas skelbimas: ' || public.listing_title(lst) || ' – ' || price,
        'htmlContent', html,
        'headers', jsonb_build_object(
          'List-Unsubscribe', '<' || site || '/api/atsisakyti?t=' || o.token || '>',
          'List-Unsubscribe-Post', 'List-Unsubscribe=One-Click')),
      timeout_milliseconds := 10000) into req;
    update public.alert_outbox set status = 'sending', request_id = req, attempts = o.attempts + 1 where id = o.id;
    update public.saved_searches set last_sent_at = now() where token = o.token;
  end loop;
end;
$$;
revoke all on function public.process_listing_alerts() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tvarkaraštis (tik Supabase, kur yra pg_cron ir pg_net)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net')
     and exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_net with schema extensions;
    create extension if not exists pg_cron;
    perform cron.schedule('listing-alerts', '* * * * *', 'select public.process_listing_alerts()');
  end if;
end;
$$;
