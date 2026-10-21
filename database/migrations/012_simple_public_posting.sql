-- Allow flexible product galleries and one-photo fashion posts. Existing records remain intact.
begin;
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
commit;
