begin;
drop policy if exists store_messages_participant_insert on public.store_messages;
create policy store_messages_participant_insert on public.store_messages
 for insert to authenticated with check (
  sender_id=(select auth.uid()) and exists(select 1 from public.store_conversations c
   join public.sellers s on s.id=c.seller_id
   where c.id=conversation_id and not s.suspended
   and (s.user_id=(select auth.uid()) or (s.messages_enabled and c.buyer_id=(select auth.uid()))))
 );
commit;
