-- Keep the exposed reporting RPC SECURITY INVOKER. The private implementation
-- performs explicit auth and seller checks before creating a report.
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
