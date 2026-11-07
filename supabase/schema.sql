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

-- ===========================================================================
-- Multiple trading accounts (safe to re-run; also upgrades an existing database)
-- ===========================================================================

create table if not exists public.accounts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  color       text not null default '#7c3aed' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at  timestamptz not null default now()
);

create unique index if not exists accounts_user_name_idx on public.accounts (user_id, lower(name));

alter table public.accounts enable row level security;

drop policy if exists "own accounts select" on public.accounts;
drop policy if exists "own accounts insert" on public.accounts;
drop policy if exists "own accounts update" on public.accounts;
drop policy if exists "own accounts delete" on public.accounts;

create policy "own accounts select" on public.accounts for select using (auth.uid() = user_id);
create policy "own accounts insert" on public.accounts for insert with check (auth.uid() = user_id);
create policy "own accounts update" on public.accounts for update using (auth.uid() = user_id);
create policy "own accounts delete" on public.accounts for delete using (auth.uid() = user_id);

-- Deleting an account deletes its trades
alter table public.trades
  add column if not exists account_id uuid references public.accounts(id) on delete cascade;

create index if not exists trades_account_idx on public.trades (account_id);

-- Existing data: create the two starter accounts for anyone who already has trades,
-- then attach their old trades to the first one.
insert into public.accounts (user_id, name, color)
select distinct user_id, 'Lubna Rahman', '#7c3aed' from public.trades where account_id is null
on conflict do nothing;

insert into public.accounts (user_id, name, color)
select distinct user_id, 'Mahbubur Rahman', '#0d9488' from public.trades where account_id is null
on conflict do nothing;

update public.trades t
set account_id = (select a.id from public.accounts a where a.user_id = t.user_id and a.name = 'Lubna Rahman')
where t.account_id is null;

do $$
begin
  alter publication supabase_realtime add table public.accounts;
exception when duplicate_object then null;
end $$;
