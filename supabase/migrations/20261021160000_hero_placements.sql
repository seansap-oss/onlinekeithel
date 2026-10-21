-- Add configurable hero and premium campaign placement controls.
begin;
alter table public.campaigns
  add column if not exists social_url text not null default '',
  add column if not exists placement text not null default 'featured',
  add column if not exists priority integer not null default 0,
  add column if not exists display_seconds integer not null default 6;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='campaigns_placement_check') then
    alter table public.campaigns add constraint campaigns_placement_check check(placement in ('hero','featured','both'));
  end if;
  if not exists(select 1 from pg_constraint where conname='campaigns_priority_check') then
    alter table public.campaigns add constraint campaigns_priority_check check(priority between 0 and 999);
  end if;
  if not exists(select 1 from pg_constraint where conname='campaigns_display_seconds_check') then
    alter table public.campaigns add constraint campaigns_display_seconds_check check(display_seconds between 3 and 60);
  end if;
end $$;
commit;
