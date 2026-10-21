-- Free launch: keep legacy orders and entitlements, but disable purchases and make
-- published listings visible without a 14-day expiry. Apply after v0.14.4.
begin;
update public.plans set active=false where id <> 'free';
insert into public.plans(id,name,price,listing_limit,duration_days,active)
 values ('free','Free Launch',0,100,365,true)
 on conflict(id) do update set name=excluded.name, price=0, listing_limit=100, duration_days=365, active=true;
create or replace function private.listing_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare cap integer; used integer;
begin
 if TG_OP='UPDATE' and new.seller_id<>old.seller_id then raise exception 'A listing cannot change owner'; end if;
 if auth.uid() is not null and not private.is_admin() then
  if not private.owner(new.seller_id) then raise exception 'Seller access denied'; end if;
  if TG_OP='UPDATE' and old.status='rejected' then raise exception 'Contact support to restore a moderated listing'; end if;
  if new.status='rejected' then raise exception 'Only moderators can reject listings'; end if;
 end if;
 if new.status='published' then
  if TG_OP='INSERT' then new.published_at=now();
  elsif old.status<>'published' then new.published_at=now();
  else new.published_at=old.published_at; end if;
 end if;
 -- Serialize all quota changes for a seller, including concurrent API/import requests.
 perform pg_advisory_xact_lock(hashtextextended(new.seller_id::text,0));
 select listing_limit into cap from public.plans where id='free';
 if new.status='published' then
  select count(*) into used from public.listings where seller_id=new.seller_id and status='published' and id<>new.id ;
  if used>=coalesce(cap,100) then raise exception 'Free launch active listing limit reached. Pause an older listing to post another.'; end if;
  if jsonb_array_length(new.images)=0 then raise exception 'Add at least one product photo'; end if;
  if not exists(select 1 from public.categories where id=new.category_id and active) then raise exception 'Category is unavailable'; end if;
 end if;
 if jsonb_typeof(new.socials)<>'object' or jsonb_typeof(new.attributes)<>'object' then raise exception 'Invalid listing details'; end if;
 new.updated_at=now(); return new;
end $$;
create or replace function private.public_listing(p_id uuid,p_seller uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists (select 1 from public.sellers where id=p_seller and not suspended)
 and exists (select 1 from public.listings where id=p_id and seller_id=p_seller and status='published') $$;
commit;
