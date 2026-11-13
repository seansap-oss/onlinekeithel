begin;
create or replace function private.hide_store_contact() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if not new.whatsapp_enabled then new.whatsapp := ''; end if;
 if not new.show_online_status and not new.show_last_active then
  new.last_active_at := null;
 elsif TG_OP='UPDATE' and new.last_active_at is distinct from old.last_active_at and new.last_active_at is not null then
  new.last_active_at := now();
 end if;
 return new;
end $$;
revoke all on function private.hide_store_contact() from public;
update public.sellers set last_active_at=null where not show_online_status and not show_last_active and last_active_at is not null;
commit;
