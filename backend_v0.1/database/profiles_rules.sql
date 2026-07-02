-- Profiles-only production RLS for Supabase
-- Assumes `profiles.id` references `auth.users(id)` and the backend uses the
-- Supabase service role key for server-side profile creation.

-- Keep RLS on for the table.
alter table public.profiles enable row level security;

-- Remove old policies so the migration is idempotent.
drop policy if exists "Profiles read own row" on public.profiles;
drop policy if exists "Profiles insert own row" on public.profiles;
drop policy if exists "Profiles update own row" on public.profiles;

-- Users can read only their own profile.
create policy "Profiles read own row"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

-- Users can create only their own profile row if you ever insert from the client.
-- If your backend inserts profiles with the service_role key, this policy is not required
-- for the backend path, but it is safe to keep for future client-side flows.
create policy "Profiles insert own row"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- Users can update only their own profile fields.
create policy "Profiles update own row"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Make sure the foreign key points to Supabase Auth, not a local `users` table.
alter table public.profiles
drop constraint if exists profiles_id_fkey;

alter table public.profiles
add constraint profiles_id_fkey
foreign key (id) references auth.users(id) on delete cascade;
