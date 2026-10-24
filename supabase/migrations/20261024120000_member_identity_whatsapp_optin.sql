begin;

create table if not exists public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.member_profiles enable row level security;
grant select (user_id, username) on public.member_profiles to authenticated;
grant insert (user_id, username), update (username) on public.member_profiles to authenticated;
create policy member_profiles_read on public.member_profiles for select to authenticated using (true);
create policy member_profiles_self_insert on public.member_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy member_profiles_self_update on public.member_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function private.create_member_profile()
returns trigger language plpgsql security definer set search_path='' as $$
declare proposed text;
begin
  proposed := coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), 'member_' || left(replace(new.id::text, '-', ''), 12));
  insert into public.member_profiles(user_id, username)
  values(new.id, proposed)
  on conflict (user_id) do nothing;
  return new;
end $$;
revoke all on function private.create_member_profile() from public, anon, authenticated;
drop trigger if exists create_member_profile on auth.users;
create trigger create_member_profile after insert on auth.users for each row execute function private.create_member_profile();

alter table public.sellers add column if not exists whatsapp_enabled boolean not null default false;
commit;
