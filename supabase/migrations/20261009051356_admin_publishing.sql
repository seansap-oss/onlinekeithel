-- Apply after 007 on an existing dedicated OnlineKeithel database.
begin;
alter table public.categories add column if not exists color text not null default '#064b3b' check(color ~ '^#[0-9a-fA-F]{6}$');
create table if not exists public.content_drafts (
 id text primary key, value jsonb not null check(jsonb_typeof(value)='object'), updated_at timestamptz not null default now()
);
create table if not exists public.content_revisions (
 id bigint generated always as identity primary key, value jsonb not null, created_at timestamptz not null default now(), actor uuid
);
alter table public.content_drafts enable row level security;
alter table public.content_revisions enable row level security;
drop policy if exists drafts_admin on public.content_drafts;
create policy drafts_admin on public.content_drafts for all to authenticated using(private.is_admin()) with check(private.is_admin());
drop policy if exists revisions_admin_read on public.content_revisions;
create policy revisions_admin_read on public.content_revisions for select to authenticated using(private.is_admin());
drop policy if exists revisions_admin_insert on public.content_revisions;
create policy revisions_admin_insert on public.content_revisions for insert to authenticated with check(private.is_admin());
grant select,insert,update,delete on public.content_drafts to authenticated;
grant select,insert on public.content_revisions to authenticated;
grant usage,select on sequence public.content_revisions_id_seq to authenticated;
grant all on public.content_drafts,public.content_revisions to service_role;
grant usage,select on sequence public.content_revisions_id_seq to service_role;
create or replace function public.publish_homepage(p_value jsonb, p_expected jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare current_value jsonb;
begin
 if not private.is_admin() then raise exception 'Administrator access required'; end if;
 if jsonb_typeof(p_value) is distinct from 'object' or length(trim(coalesce(p_value->>'hero_title',''))) = 0 then raise exception 'A hero headline is required'; end if;
 if p_value->>'name' is distinct from 'OnlineKeithel' then raise exception 'Marketplace name must be OnlineKeithel'; end if;
 select value into current_value from public.settings where id='marketplace' for update;
 if not found then raise exception 'Marketplace settings missing'; end if;
 if current_value is distinct from p_expected then raise exception 'Another administrator published changes. Reload before publishing.'; end if;
 insert into public.content_revisions(value,actor) values(current_value,auth.uid());
 update public.settings set value=p_value where id='marketplace';
 delete from public.content_drafts where id='marketplace';
end $$;
revoke all on function public.publish_homepage(jsonb,jsonb) from public,anon;
grant execute on function public.publish_homepage(jsonb,jsonb) to authenticated;
drop trigger if exists category_audit on public.categories;
create trigger category_audit after insert or update or delete on public.categories for each row execute function private.audit();
update public.settings set value=jsonb_set(value,'{name}','"OnlineKeithel"') where id='marketplace';
commit;
