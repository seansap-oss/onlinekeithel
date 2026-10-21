-- Refresh listing packages and remove legacy four-angle fashion rule.
-- Existing paid entitlements and old orders are retained. Apply after the base schema.
begin;
alter table public.plans add column if not exists duration_days integer not null default 30 check(duration_days between 1 and 365);
alter table public.billing_orders add column if not exists duration_days integer not null default 30 check(duration_days between 1 and 365);
alter table public.listings add column if not exists published_at timestamptz;
update public.listings set published_at=coalesce(updated_at,created_at) where status='published' and published_at is null;
update public.plans set active=false where id in ('starter','growth','catalogue');
insert into public.plans(id,name,price,listing_limit,duration_days,active) values
 ('free','Free',0,2,14,true),
 ('quick','Quick Seller',100,5,14,true),
 ('individual','Individual',200,10,30,true),
 ('premium','Premium Business',400,20,30,true),
 ('business','Business Plus',600,50,30,true)
on conflict(id) do update set name=excluded.name,price=excluded.price,listing_limit=excluded.listing_limit,duration_days=excluded.duration_days,active=excluded.active;
-- Old installations may still have the old 12-photo check.
do $$ declare c record; begin
 for c in select conname from pg_constraint where conrelid='public.listings'::regclass and contype='c' and pg_get_constraintdef(oid) like '%jsonb_array_length(images)%' loop
  execute format('alter table public.listings drop constraint %I', c.conname);
 end loop;
end $$;
alter table public.listings add constraint listings_images_gallery_check
 check(jsonb_typeof(images)='array' and jsonb_array_length(images)<=50);
create or replace function private.product_options_guard() returns trigger language plpgsql security invoker set search_path='' as $$
declare c jsonb; v jsonb; seen_ids text[] := '{}'; seen_labels text[] := '{}';
begin
 c:=new.commerce;
 if jsonb_typeof(c)<>'object' or jsonb_typeof(new.videos)<>'array' then raise exception 'Invalid product options or videos'; end if;
 if c ? 'mode' and coalesce(c->>'mode','') not in ('enquiry','retail') then raise exception 'Invalid selling mode'; end if;
 if c ? 'stock' and c->'stock'<>'null'::jsonb then
  if jsonb_typeof(c->'stock')<>'number' or (c->>'stock')::numeric<0 or (c->>'stock')::numeric>1000000 or (c->>'stock')::numeric<>trunc((c->>'stock')::numeric) then raise exception 'Invalid stock count'; end if;
 end if;
 if c ? 'unit' and (jsonb_typeof(c->'unit')<>'string' or length(c->>'unit')>40) then raise exception 'Invalid selling unit'; end if;
 if c ? 'delivery' and (jsonb_typeof(c->'delivery')<>'string' or length(c->>'delivery')>500) then raise exception 'Invalid delivery details'; end if;
 if c ? 'variants' then
  if jsonb_typeof(c->'variants')<>'array' then raise exception 'Invalid product variants'; end if;
  if jsonb_array_length(c->'variants')>100 then raise exception 'Maximum 100 product variants'; end if;
  for v in select value from jsonb_array_elements(c->'variants') loop
   if jsonb_typeof(v)<>'object' or not (v ?& array['id','label','stock']) then raise exception 'Invalid variant'; end if;
   if jsonb_typeof(v->'id')<>'string' or coalesce(v->>'id','') !~ '^[a-zA-Z0-9_-]{1,64}$' or (v->>'id')=any(seen_ids) then raise exception 'Variant ID must be unique'; end if;
   if jsonb_typeof(v->'label')<>'string' or length(trim(v->>'label')) not between 1 and 80 or lower(trim(v->>'label'))=any(seen_labels) then raise exception 'Variant label must be unique'; end if;
   if jsonb_typeof(v->'stock')<>'number' or (v->>'stock')::numeric<0 or (v->>'stock')::numeric>1000000 or (v->>'stock')::numeric<>trunc((v->>'stock')::numeric) then raise exception 'Invalid variant stock'; end if;
   if v ? 'price' and v->'price'<>'null'::jsonb then
    if jsonb_typeof(v->'price')<>'number' or (v->>'price')::numeric<0 or (v->>'price')::numeric>9999999999.99 then raise exception 'Invalid variant price'; end if;
   end if;
   seen_ids:=array_append(seen_ids,v->>'id');seen_labels:=array_append(seen_labels,lower(trim(v->>'label')));
  end loop;
 end if;
 if jsonb_array_length(new.videos)>6 then raise exception 'Maximum six videos'; end if;
 for v in select value from jsonb_array_elements(new.videos) loop
  if jsonb_typeof(v)<>'object' or jsonb_typeof(v->'url') is distinct from 'string' or coalesce(v->>'url','') !~* '^https://((www\.|m\.)?(youtube\.com|youtu\.be|instagram\.com|facebook\.com|fb\.watch)/[^[:space:]]*|[^[:space:]]+\.(mp4|webm)(\?[^[:space:]]*)?)$' then raise exception 'Invalid video URL'; end if;
  if v ? 'title' and (jsonb_typeof(v->'title')<>'string' or length(v->>'title')>100) then raise exception 'Invalid video title'; end if;
 end loop;
 return new;
end $$;
revoke all on function private.product_options_guard() from public;
create or replace function private.listing_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare cap integer; used integer; imgs integer;
begin
 if TG_OP='UPDATE' and new.seller_id<>old.seller_id then raise exception 'A listing cannot change owner'; end if;
 if auth.uid() is not null and not private.is_admin() then
  if not private.owner(new.seller_id) then raise exception 'Seller access denied'; end if;
  if TG_OP='UPDATE' and old.status='rejected' then raise exception 'Contact support to restore a moderated listing'; end if;
  if new.status='rejected' then raise exception 'Only moderators can reject listings'; end if;
 end if;
 if new.status='published' then
  if TG_OP='INSERT' then new.published_at=now();
  elsif old.status<>'published' or (old.published_at is not null and old.published_at < now()-interval '14 days' and not exists(select 1 from public.entitlements where seller_id=new.seller_id and expires_at>now())) then new.published_at=now();
  else new.published_at=old.published_at; end if;
 end if;
 -- Serialize all quota changes for a seller, including concurrent API/import requests.
 perform pg_advisory_xact_lock(hashtextextended(new.seller_id::text,0));
 select listing_limit into cap from public.entitlements where seller_id=new.seller_id and expires_at>now();
 if cap is null then select listing_limit into cap from public.plans where id='free'; end if;
 if new.status='published' then
  select count(*) into used from public.listings where seller_id=new.seller_id and status='published' and id<>new.id and (exists(select 1 from public.entitlements where seller_id=new.seller_id and expires_at>now()) or published_at>=now()-interval '14 days');
  if used>=coalesce(cap,2) then raise exception 'Active listing limit reached. Pause a listing or upgrade your package.'; end if;
  if jsonb_array_length(new.images)=0 then raise exception 'Add at least one product photo'; end if;
  if not exists(select 1 from public.categories where id=new.category_id and active) then raise exception 'Category is unavailable'; end if;
 end if;
 if jsonb_typeof(new.socials)<>'object' or jsonb_typeof(new.attributes)<>'object' then raise exception 'Invalid listing details'; end if;
 new.updated_at=now(); return new;
end $$;
create or replace function private.public_listing(p_id uuid,p_seller uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.sellers where id=p_seller and not suspended) and p_id in (
 select id from public.listings where seller_id=p_seller and status='published' and (exists(select 1 from public.entitlements where seller_id=p_seller and expires_at>now()) or published_at>=now()-interval '14 days') order by published_at desc,id limit coalesce((select listing_limit from public.entitlements where seller_id=p_seller and expires_at>now()),(select listing_limit from public.plans where id='free'),2)) $$;
create or replace function public.fulfill_order(p_order text,p_payment text) returns void language plpgsql security invoker set search_path='' as $$
declare o public.billing_orders; until_at timestamptz;
begin
 select * into o from public.billing_orders where gateway_order_id=p_order for update;
 if not found then raise exception 'Unknown order'; end if;
 if o.status='paid' then return; end if;
 perform pg_advisory_xact_lock(hashtextextended(o.seller_id::text,0));
 select greatest(now(),expires_at) into until_at from public.entitlements where seller_id=o.seller_id;
 insert into public.entitlements(seller_id,plan_id,listing_limit,expires_at) values(o.seller_id,o.plan_id,o.listing_limit,coalesce(until_at,now())+make_interval(days=>o.duration_days)) on conflict(seller_id) do update set plan_id=excluded.plan_id,listing_limit=excluded.listing_limit,expires_at=excluded.expires_at,updated_at=now();
 update public.billing_orders set status='paid',gateway_payment_id=p_payment where id=o.id;
end $$;
commit;
