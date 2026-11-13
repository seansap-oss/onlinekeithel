-- Store-wide messages, stock/visibility and opt-in availability controls.
begin;

alter table public.listings add column if not exists is_hidden boolean not null default false;
alter table public.listings add column if not exists is_out_of_stock boolean not null default false;
create or replace function private.public_listing(p_id uuid,p_seller uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists (select 1 from public.sellers where id=p_seller and not suspended)
 and exists (select 1 from public.listings where id=p_id and seller_id=p_seller and status='published' and not is_hidden)
$$;

alter table public.sellers
 add column if not exists messages_enabled boolean not null default true,
 add column if not exists show_online_status boolean not null default false,
 add column if not exists show_last_active boolean not null default false,
 add column if not exists notify_email boolean not null default false,
 add column if not exists notify_whatsapp boolean not null default false,
 add column if not exists last_active_at timestamptz;

-- Keep a private delivery number even while the public WhatsApp contact is hidden.
create table if not exists public.seller_private_contacts (
 seller_id uuid primary key references public.sellers(id) on delete cascade,
 whatsapp text not null default '' check (length(whatsapp) <= 20),
 updated_at timestamptz not null default now()
);
insert into public.seller_private_contacts(seller_id,whatsapp)
 select id,coalesce(whatsapp,'') from public.sellers where coalesce(whatsapp,'') <> ''
 on conflict(seller_id) do nothing;
alter table public.sellers drop constraint if exists sellers_whatsapp_check;
alter table public.sellers add constraint sellers_whatsapp_check check (whatsapp = '' or whatsapp ~ '^[1-9][0-9]{7,14}$');
update public.sellers set whatsapp='' where whatsapp_enabled=false and whatsapp <> '';
create or replace function private.hide_store_contact() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if not new.whatsapp_enabled then new.whatsapp := ''; end if;
 return new;
end $$;
revoke all on function private.hide_store_contact() from public;
drop trigger if exists hide_store_contact on public.sellers;
create trigger hide_store_contact before insert or update on public.sellers
 for each row execute function private.hide_store_contact();
alter table public.seller_private_contacts enable row level security;
grant select,insert,update on public.seller_private_contacts to authenticated;
create policy seller_private_contact_owner_read on public.seller_private_contacts
 for select to authenticated using (private.owner(seller_id) or private.is_admin());
create policy seller_private_contact_owner_insert on public.seller_private_contacts
 for insert to authenticated with check (private.owner(seller_id) or private.is_admin());
create policy seller_private_contact_owner_update on public.seller_private_contacts
 for update to authenticated using (private.owner(seller_id) or private.is_admin())
 with check (private.owner(seller_id) or private.is_admin());

create table if not exists public.store_conversations (
 id uuid primary key default gen_random_uuid(),
 seller_id uuid not null references public.sellers(id) on delete cascade,
 buyer_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 unique(seller_id,buyer_id)
);
create index if not exists store_conversations_buyer_idx on public.store_conversations(buyer_id,created_at desc);
create index if not exists store_conversations_seller_idx on public.store_conversations(seller_id,created_at desc);
alter table public.store_conversations enable row level security;
grant select,insert on public.store_conversations to authenticated;
create policy store_conversations_participant_read on public.store_conversations
 for select to authenticated using (buyer_id=(select auth.uid()) or private.owner(seller_id) or private.is_admin());
create policy store_conversations_buyer_start on public.store_conversations
 for insert to authenticated with check (
  buyer_id=(select auth.uid()) and not private.owner(seller_id)
  and exists(select 1 from public.sellers where id=seller_id and not suspended and messages_enabled)
 );

create table if not exists public.store_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.store_conversations(id) on delete cascade,
 sender_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 body text not null check(length(trim(body)) between 1 and 4000),
 created_at timestamptz not null default now()
);
create index if not exists store_messages_conversation_idx on public.store_messages(conversation_id,created_at);
alter table public.store_messages enable row level security;
grant select,insert on public.store_messages to authenticated;
create policy store_messages_participant_read on public.store_messages
 for select to authenticated using (
  exists(select 1 from public.store_conversations c where c.id=conversation_id
   and (c.buyer_id=(select auth.uid()) or private.owner(c.seller_id) or private.is_admin()))
 );
create policy store_messages_participant_insert on public.store_messages
 for insert to authenticated with check (
  sender_id=(select auth.uid()) and exists(select 1 from public.store_conversations c
   join public.sellers s on s.id=c.seller_id
   where c.id=conversation_id and not s.suspended and s.messages_enabled
   and (c.buyer_id=(select auth.uid()) or s.user_id=(select auth.uid())))
 );

alter table public.plans add column if not exists email_alerts boolean not null default false;
alter table public.plans add column if not exists whatsapp_alerts boolean not null default false;
update public.plans set email_alerts=true,whatsapp_alerts=true where id='free';
commit;
