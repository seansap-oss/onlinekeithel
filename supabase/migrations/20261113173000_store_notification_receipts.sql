-- Delivery receipts prevent repeated browser requests from sending duplicate alerts.
begin;
create table if not exists public.store_notification_receipts (
 message_id uuid not null references public.store_messages(id) on delete cascade,
 channel text not null check(channel in ('email','whatsapp')),
 created_at timestamptz not null default now(),
 primary key(message_id,channel)
);
alter table public.store_notification_receipts enable row level security;
-- No client grants or policies: only the service role can claim delivery.
commit;
