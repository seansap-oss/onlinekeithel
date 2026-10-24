-- OnlineKeithel: public listing questions and private buyer/seller messaging.
begin;

create table if not exists public.listing_questions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 2000),
  seller_reply text check (seller_reply is null or length(trim(seller_reply)) between 1 and 2000),
  seller_replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists listing_questions_listing_created_idx
  on public.listing_questions(listing_id, created_at);
create index if not exists listing_questions_author_idx on public.listing_questions(author_id);
alter table public.listing_questions enable row level security;
grant select on public.listing_questions to anon, authenticated;
grant insert(listing_id, author_id, body) on public.listing_questions to authenticated;
grant update(seller_reply) on public.listing_questions to authenticated;
drop policy if exists listing_questions_public_read on public.listing_questions;
create policy listing_questions_public_read on public.listing_questions
  for select to anon, authenticated using (
    private.is_admin() or exists (select 1 from public.listings l where l.id = listing_id
      and l.status = 'published' and private.public_listing(l.id, l.seller_id))
  );
drop policy if exists listing_questions_signed_in_insert on public.listing_questions;
create policy listing_questions_signed_in_insert on public.listing_questions
  for insert to authenticated with check (
    author_id = (select auth.uid())
    and exists (select 1 from public.listings l where l.id = listing_id
      and l.status = 'published' and l.seller_id is not null
      and private.public_listing(l.id, l.seller_id))
  );
drop policy if exists listing_questions_seller_reply on public.listing_questions;
create policy listing_questions_seller_reply on public.listing_questions
  for update to authenticated using (
    exists (select 1 from public.listings l join public.sellers s on s.id = l.seller_id
      where l.id = listing_id and s.user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.listings l join public.sellers s on s.id = l.seller_id
      where l.id = listing_id and s.user_id = (select auth.uid()))
  );
drop policy if exists listing_questions_admin_delete on public.listing_questions;
create policy listing_questions_admin_delete on public.listing_questions
  for delete to authenticated using (private.is_admin());
grant delete on public.listing_questions to authenticated;
create or replace function private.stamp_seller_question_reply()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.seller_reply is distinct from old.seller_reply then
    new.seller_replied_at := case when nullif(trim(new.seller_reply), '') is null then null else now() end;
  end if;
  return new;
end $$;
revoke all on function private.stamp_seller_question_reply() from public;
drop trigger if exists stamp_seller_question_reply on public.listing_questions;
create trigger stamp_seller_question_reply before update of seller_reply
  on public.listing_questions for each row execute function private.stamp_seller_question_reply();

create table if not exists public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(listing_id, buyer_id)
);
create index if not exists direct_conversations_buyer_created_idx
  on public.direct_conversations(buyer_id, created_at desc);
alter table public.direct_conversations enable row level security;
grant select on public.direct_conversations to authenticated;
grant insert on public.direct_conversations to authenticated;
drop policy if exists direct_conversations_participant_read on public.direct_conversations;
create policy direct_conversations_participant_read on public.direct_conversations
  for select to authenticated using (
    buyer_id = (select auth.uid()) or exists (
      select 1 from public.listings l join public.sellers s on s.id = l.seller_id
      where l.id = listing_id and s.user_id = (select auth.uid())
    ) or private.is_admin()
  );
drop policy if exists direct_conversations_buyer_start on public.direct_conversations;
create policy direct_conversations_buyer_start on public.direct_conversations
  for insert to authenticated with check (
    buyer_id = (select auth.uid())
    and not exists (select 1 from public.listings l join public.sellers s on s.id = l.seller_id
      where l.id = listing_id and s.user_id = (select auth.uid()))
    and exists (select 1 from public.listings l where l.id = listing_id
      and l.status = 'published' and private.public_listing(l.id, l.seller_id))
  );

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists direct_messages_conversation_created_idx
  on public.direct_messages(conversation_id, created_at);
create index if not exists direct_messages_sender_idx on public.direct_messages(sender_id);
alter table public.direct_messages enable row level security;
grant select, insert, delete on public.direct_messages to authenticated;
drop policy if exists direct_messages_participant_read on public.direct_messages;
create policy direct_messages_participant_read on public.direct_messages
  for select to authenticated using (
    exists (select 1 from public.direct_conversations c
      where c.id = conversation_id and (
        c.buyer_id = (select auth.uid()) or exists (
          select 1 from public.listings l join public.sellers s on s.id = l.seller_id
          where l.id = c.listing_id and s.user_id = (select auth.uid())
        )
      )) or private.is_admin()
  );
drop policy if exists direct_messages_participant_insert on public.direct_messages;
create policy direct_messages_participant_insert on public.direct_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid())
    and exists (select 1 from public.direct_conversations c
      where c.id = conversation_id and (
        c.buyer_id = (select auth.uid()) or exists (
          select 1 from public.listings l join public.sellers s on s.id = l.seller_id
          where l.id = c.listing_id and s.user_id = (select auth.uid())
        )
      ))
  );
drop policy if exists direct_messages_admin_delete on public.direct_messages;
create policy direct_messages_admin_delete on public.direct_messages
  for delete to authenticated using (private.is_admin());

create table if not exists public.listing_message_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.listing_questions(id) on delete cascade,
  message_id uuid references public.direct_messages(id) on delete cascade,
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason text not null check (length(trim(reason)) between 5 and 500),
  created_at timestamptz not null default now(),
  check ((question_id is null) <> (message_id is null))
);
create unique index if not exists listing_message_question_report_once
  on public.listing_message_reports(question_id, reporter_id) where question_id is not null;
create unique index if not exists listing_message_direct_report_once
  on public.listing_message_reports(message_id, reporter_id) where message_id is not null;
create index if not exists listing_message_reports_created_idx
  on public.listing_message_reports(created_at desc);
create index if not exists listing_message_reports_reporter_idx on public.listing_message_reports(reporter_id);
alter table public.listing_message_reports enable row level security;
grant select, delete on public.listing_message_reports to authenticated;
create or replace function private.can_report_listing_question(p_question_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists (
    select 1 from public.listing_questions q
    join public.listings l on l.id=q.listing_id
    join public.sellers s on s.id=l.seller_id
    where q.id=p_question_id and q.author_id<>auth.uid() and s.user_id=auth.uid()
  )
$$;
create or replace function private.can_report_direct_message(p_message_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists (
    select 1 from public.direct_messages m
    join public.direct_conversations c on c.id=m.conversation_id
    join public.listings l on l.id=c.listing_id
    join public.sellers s on s.id=l.seller_id
    where m.id=p_message_id and m.sender_id<>auth.uid() and s.user_id=auth.uid()
  )
$$;
revoke all on function private.can_report_listing_question(uuid) from public,anon;
revoke all on function private.can_report_direct_message(uuid) from public,anon;
grant execute on function private.can_report_listing_question(uuid) to authenticated;
grant execute on function private.can_report_direct_message(uuid) to authenticated;
create or replace function private.create_listing_message_report(
  p_question_id uuid,
  p_message_id uuid,
  p_reason text
) returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if (p_question_id is null) = (p_message_id is null) then raise exception 'Choose one message to report'; end if;
  if length(trim(coalesce(p_reason,''))) not between 5 and 500 then raise exception 'Report reason must be 5 to 500 characters'; end if;
  if p_question_id is not null and not private.can_report_listing_question(p_question_id) then
    raise exception 'Only the listing seller can report another member’s question';
  end if;
  if p_message_id is not null and not private.can_report_direct_message(p_message_id) then
    raise exception 'Only the listing seller can report an incoming message';
  end if;
  insert into public.listing_message_reports(question_id,message_id,reporter_id,reason)
    values(p_question_id,p_message_id,auth.uid(),trim(p_reason)) returning id into new_id;
  return new_id;
end $$;
revoke all on function private.create_listing_message_report(uuid,uuid,text) from public,anon;
grant execute on function private.create_listing_message_report(uuid,uuid,text) to authenticated;
create or replace function public.report_listing_message(
  p_question_id uuid,
  p_message_id uuid,
  p_reason text
) returns uuid language sql security invoker set search_path='' as $$
  select private.create_listing_message_report(p_question_id,p_message_id,p_reason)
$$;
revoke all on function public.report_listing_message(uuid,uuid,text) from public,anon;
grant execute on function public.report_listing_message(uuid,uuid,text) to authenticated;
drop policy if exists listing_message_reports_admin_read on public.listing_message_reports;
create policy listing_message_reports_admin_read on public.listing_message_reports
  for select to authenticated using (private.is_admin());
drop policy if exists listing_message_reports_admin_delete on public.listing_message_reports;
create policy listing_message_reports_admin_delete on public.listing_message_reports
  for delete to authenticated using (private.is_admin());

grant all on public.listing_questions, public.direct_conversations,
  public.direct_messages, public.listing_message_reports to service_role;

-- Enable Postgres Changes for public questions, new conversations and private chat.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename='listing_questions') then
      alter publication supabase_realtime add table public.listing_questions;
    end if;
    if not exists(select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename='direct_conversations') then
      alter publication supabase_realtime add table public.direct_conversations;
    end if;
    if not exists(select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename='direct_messages') then
      alter publication supabase_realtime add table public.direct_messages;
    end if;
  end if;
end $$;
commit;
