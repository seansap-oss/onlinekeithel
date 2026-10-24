-- Index the new messaging foreign keys used for author/sender/reporter lookups.
create index if not exists listing_questions_author_idx
  on public.listing_questions(author_id);
create index if not exists direct_messages_sender_idx
  on public.direct_messages(sender_id);
create index if not exists listing_message_reports_reporter_idx
  on public.listing_message_reports(reporter_id);
