-- Prisijungimas slapyvardžiu: paskyros su slaptažodžiu turi tik techninį adresą
-- <slapyvardis>@slapyvardis.invalid (žr. src/lib/username.ts).
-- Tikru el. pašto adresu per slaptažodį registruotis neleidžiama. Kitaip kas nors galėtų iš anksto
-- užimti svetimą adresą be patvirtinimo, o jo savininkui vėliau prisijungus per Google paskyros susijungtų.
-- Migracija kartojama saugiai.

create or replace function public.guard_password_accounts() returns trigger
language plpgsql set search_path = ''
as $$
declare
  slug constant text := '^[a-z0-9][a-z0-9._-]{2,23}@slapyvardis\.invalid$';
begin
  if tg_op = 'INSERT' then
    if new.raw_app_meta_data ->> 'provider' = 'email' and coalesce(new.email, '') !~ slug then
      raise exception 'Slaptažodžiu galima registruotis tik su slapyvardžiu' using errcode = 'check_violation';
    end if;
  elsif old.email ~ slug and (coalesce(new.email, '') !~ slug or coalesce(new.email_change, '') <> '') then
    raise exception 'Slapyvardžio paskyros el. pašto keisti negalima' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_password_accounts on auth.users;
create trigger guard_password_accounts
  before insert or update of email, email_change on auth.users
  for each row execute function public.guard_password_accounts();
