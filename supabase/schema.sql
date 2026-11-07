-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

create table if not exists public.trades (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trade_date   date not null,
  symbol       text not null,
  trade_type   text not null check (trade_type in ('scalping', 'intraday', 'swing')),
  direction    text not null check (direction in ('buy', 'sell')),
  lot_size     numeric not null default 0,
  entry_price  numeric,
  stop_loss    numeric,
  take_profit  numeric,
  exit_price   numeric,
  result       text not null check (result in ('win', 'loss', 'breakeven')),
  pnl          numeric not null default 0,
  checklist    jsonb not null default '{}'::jsonb,
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists trades_user_date_idx on public.trades (user_id, trade_date desc);

-- Each person can only see and change their own trades
alter table public.trades enable row level security;

drop policy if exists "own trades select" on public.trades;
drop policy if exists "own trades insert" on public.trades;
drop policy if exists "own trades update" on public.trades;
drop policy if exists "own trades delete" on public.trades;

create policy "own trades select" on public.trades for select using (auth.uid() = user_id);
create policy "own trades insert" on public.trades for insert with check (auth.uid() = user_id);
create policy "own trades update" on public.trades for update using (auth.uid() = user_id);
create policy "own trades delete" on public.trades for delete using (auth.uid() = user_id);

-- Live sync between phone and browser
do $$
begin
  alter publication supabase_realtime add table public.trades;
exception when duplicate_object then null;
end $$;
