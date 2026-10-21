-- Listing photo count is not tier-limited. Keep the JSON array type check.
begin;
do $$ declare c record; begin
 for c in select conname from pg_constraint where conrelid='public.listings'::regclass and contype='c' and pg_get_constraintdef(oid) like '%jsonb_array_length(images)%' loop
  execute format('alter table public.listings drop constraint %I', c.conname);
 end loop;
end $$;
alter table public.listings drop constraint if exists listings_images_gallery_check;
alter table public.listings add constraint listings_images_gallery_check check(jsonb_typeof(images)='array');
commit;

