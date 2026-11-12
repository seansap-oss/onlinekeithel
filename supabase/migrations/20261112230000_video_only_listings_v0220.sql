-- Publish a listing with a validated public video even when no photo is uploaded.
-- The existing private.product_options_guard trigger validates supported video URLs.
begin;
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
  if jsonb_array_length(new.images)=0 and jsonb_array_length(new.videos)=0 then raise exception 'Add a product photo or a public video'; end if;
  if not exists(select 1 from public.categories where id=new.category_id and active) then raise exception 'Category is unavailable'; end if;
 end if;
 if jsonb_typeof(new.socials)<>'object' or jsonb_typeof(new.attributes)<>'object' then raise exception 'Invalid listing details'; end if;
 new.updated_at=now(); return new;
end $$;
commit;
