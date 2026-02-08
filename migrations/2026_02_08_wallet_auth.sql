-- Wallet auth tables + wallet_id linkage
-- 2026_02_08_wallet_auth.sql

-- wallets table
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  address text not null unique,
  created_at timestamptz default now()
);

-- user_wallets table
create table if not exists public.user_wallets (
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  label text null,
  is_primary boolean default false,
  created_at timestamptz default now(),
  primary key (user_id, wallet_id)
);

-- auth nonces for signed linking
create table if not exists public.auth_nonces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  nonce text not null,
  expires_at timestamptz not null,
  used_at timestamptz null
);

create index if not exists auth_nonces_user_wallet_idx on public.auth_nonces(user_id, wallet_address);
create index if not exists auth_nonces_expires_idx on public.auth_nonces(expires_at);

-- wallet_id linkage for data tables
alter table public.fills add column if not exists wallet_id uuid null references public.wallets(id) on delete set null;
alter table public.journal_entries add column if not exists wallet_id uuid null references public.wallets(id) on delete set null;
alter table public.imports add column if not exists wallet_id uuid null references public.wallets(id) on delete set null;
alter table public.fill_annotations add column if not exists wallet_id uuid null references public.wallets(id) on delete set null;

-- backfill wallets from existing accounts
insert into public.wallets(address)
select distinct wallet_address
from public.accounts
where wallet_address is not null
on conflict (address) do nothing;

insert into public.user_wallets(user_id, wallet_id, label, is_primary)
select a.user_id, w.id, a.label, false
from public.accounts a
join public.wallets w on w.address = a.wallet_address
on conflict (user_id, wallet_id) do nothing;

with ranked as (
  select user_id, wallet_id,
         row_number() over (partition by user_id order by created_at) as rn
  from public.user_wallets
)
update public.user_wallets uw
set is_primary = true
from ranked r
where uw.user_id = r.user_id and uw.wallet_id = r.wallet_id and r.rn = 1;

update public.fills f
set wallet_id = w.id
from public.accounts a
join public.wallets w on w.address = a.wallet_address
where f.wallet_id is null and f.account_id = a.id;

update public.journal_entries j
set wallet_id = w.id
from public.accounts a
join public.wallets w on w.address = a.wallet_address
where j.wallet_id is null and j.account_id = a.id;

update public.imports i
set wallet_id = w.id
from public.accounts a
join public.wallets w on w.address = a.wallet_address
where i.wallet_id is null and i.account_id = a.id;

update public.fill_annotations fa
set wallet_id = f.wallet_id
from public.fills f
where fa.wallet_id is null and fa.fill_id = f.id and f.wallet_id is not null;

-- RLS policies
alter table public.wallets enable row level security;
alter table public.user_wallets enable row level security;
alter table public.auth_nonces enable row level security;

drop policy if exists wallets_select_linked on public.wallets;
create policy wallets_select_linked on public.wallets
  for select
  using (
    exists (
      select 1 from public.user_wallets uw
      where uw.wallet_id = wallets.id and uw.user_id = auth.uid()
    )
  );

drop policy if exists user_wallets_select on public.user_wallets;
create policy user_wallets_select on public.user_wallets
  for select
  using (user_id = auth.uid());

drop policy if exists auth_nonces_select on public.auth_nonces;
create policy auth_nonces_select on public.auth_nonces
  for select
  using (user_id = auth.uid());

drop policy if exists auth_nonces_insert on public.auth_nonces;
create policy auth_nonces_insert on public.auth_nonces
  for insert
  with check (user_id = auth.uid());

drop policy if exists auth_nonces_update on public.auth_nonces;
create policy auth_nonces_update on public.auth_nonces
  for update
  using (user_id = auth.uid());


