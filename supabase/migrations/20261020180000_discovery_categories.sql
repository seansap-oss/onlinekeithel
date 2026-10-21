-- OnlineKeithel v0.12: additive marketplace discovery categories.
begin;
insert into public.categories(id,name,theme,fields,position,active,icon,group_name,subcategories)
values
  ('freebies','Free & wanted','general','["Listing type", "Pickup area"]'::jsonb,33,true,'Gift','Community exchange','[{"id":"free-items","name":"Free items","icon":"Gift"},{"id":"wanted-ads","name":"Wanted ads","icon":"MagnifyingGlass"},{"id":"swap-trade","name":"Swap & trade","icon":"ArrowsLeftRight"},{"id":"community-giveaways","name":"Community giveaways","icon":"Gift"}]'::jsonb),
  ('boats','Boats & watercraft','vehicles','["Make", "Model", "Year", "Engine", "Condition"]'::jsonb,34,true,'Boat','Vehicles & transport','[{"id":"boats-watercraft","name":"Boats & watercraft","icon":"Boat"},{"id":"jet-skis","name":"Jet skis & personal watercraft","icon":"Boat"},{"id":"boat-engines-parts","name":"Boat engines & parts","icon":"Wrench"},{"id":"boat-trailers-accessories","name":"Boat trailers & accessories","icon":"Boat"}]'::jsonb),
  ('music','Musical instruments & audio','electronics','["Brand", "Model", "Condition"]'::jsonb,35,true,'MusicNotes','Shopping','[{"id":"guitars-string-instruments","name":"Guitars & string instruments","icon":"MusicNotes"},{"id":"keyboards-pianos","name":"Keyboards & pianos","icon":"MusicNotes"},{"id":"drums-percussion","name":"Drums & percussion","icon":"MusicNotes"},{"id":"wind-brass-instruments","name":"Wind & brass instruments","icon":"MusicNotes"},{"id":"recording-pa-equipment","name":"Recording & PA equipment","icon":"MusicNotes"},{"id":"music-lessons","name":"Music lessons & services","icon":"MusicNotes"}]'::jsonb)
on conflict(id) do nothing;
with additions(id, children) as (
  values
    ('retail', '[{"id":"antiques-collectibles","name":"Antiques & collectibles","icon":"Storefront"}]'::jsonb),
    ('business', '[{"id":"business-for-sale","name":"Businesses for sale","icon":"Briefcase"}]'::jsonb),
    ('happenings', '[{"id":"tickets-entry-passes","name":"Tickets & entry passes","icon":"CalendarDots"},{"id":"community-notices","name":"Community notices","icon":"CalendarDots"}]'::jsonb)
)
update public.categories c
set subcategories = c.subcategories || coalesce((
  select jsonb_agg(a.value)
  from jsonb_array_elements(additions.children) a(value)
  where not exists (
    select 1 from jsonb_array_elements(c.subcategories) old(value)
    where old.value->>'id' = a.value->>'id'
  )
), '[]'::jsonb)
from additions
where c.id = additions.id;
commit;
