-- Prisijungimas el. paštu ir slaptažodžiu (vietoj slapyvardžių).
-- Supabase dabar reikalauja patvirtinti el. paštą laišku (mailer_autoconfirm: false), todėl svetimo
-- adreso iš anksto užimti nebegalima ir 0003 apribojimas slapyvardžių adresams nebereikalingas.
drop trigger if exists guard_password_accounts on auth.users;
drop function if exists public.guard_password_accounts();
