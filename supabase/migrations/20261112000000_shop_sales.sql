create table public.shop_sales (
 id uuid primary key default gen_random_uuid(),
 seller_id uuid not null references public.sellers(id) on delete cascade,
 sold_on date not null default current_date,
 item text not null check(length(trim(item)) between 1 and 200),
 quantity integer not null check(quantity between 1 and 1000000),
 unit_price numeric(12,2) not null check(unit_price >= 0)
);
create index shop_sales_owner_date on public.shop_sales(seller_id,sold_on desc);
alter table public.shop_sales enable row level security;
revoke all on public.shop_sales from public, anon, authenticated;
grant select,insert on public.shop_sales to authenticated;
create policy own_sales_read on public.shop_sales for select to authenticated using
 (exists(select 1 from public.sellers s where s.id=seller_id and s.user_id=auth.uid()));
create policy own_sales_record on public.shop_sales for insert to authenticated with check
 (exists(select 1 from public.sellers s where s.id=seller_id and s.user_id=auth.uid()));
