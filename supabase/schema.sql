-- =============================================================================
-- TRADING PLATFORM — DATABASE SCHEMA
-- Run this entire file in your Supabase SQL Editor (Dashboard → SQL Editor → New)
-- =============================================================================

-- 1. PROFILES TABLE -----------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text unique not null,
  full_name       text,
  avatar_url      text,
  role            text not null default 'user' check (role in ('user','moderator','admin')),
  plan            text not null default 'free' check (plan in ('free','pro','premium')),
  banned          boolean not null default false,
  banned_reason   text,
  banned_at       timestamptz,
  last_seen       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_role_idx  on public.profiles(role);

-- 2. ACCOUNTS TABLE (trading accounts: funded, eval, live, etc.) -------------
create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  type            text not null default 'eval' check (type in ('funded','eval','live','pa')),
  firm            text,
  size            text,
  platform        text,
  status          text default 'active' check (status in ('active','passed','failed','withdrawn','inactive')),
  balance         text,
  start_date      date,
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists accounts_user_idx on public.accounts(user_id);

-- 3. TRADES TABLE -------------------------------------------------------------
create table if not exists public.trades (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  account_id      uuid references public.accounts(id) on delete set null,
  trade_date      date not null,
  symbol          text not null,
  direction       text not null check (direction in ('Long','Short')),
  contracts       int  not null default 1,
  entry_price     numeric(14,4),
  exit_price      numeric(14,4),
  stop_price      numeric(14,4),
  pnl             numeric(14,2) not null default 0,
  commission      numeric(14,2) not null default 0,
  r_multiple      numeric(8,2),
  setup           text,
  session         text,
  grade           text,
  notes           text,
  is_flagged      boolean not null default false,
  flag_reason     text,
  created_at      timestamptz not null default now()
);

create index if not exists trades_user_idx     on public.trades(user_id);
create index if not exists trades_account_idx  on public.trades(account_id);
create index if not exists trades_date_idx     on public.trades(trade_date desc);
create index if not exists trades_flagged_idx  on public.trades(is_flagged) where is_flagged = true;

-- 4. JOURNAL ENTRIES TABLE (daily playbook entries) -------------------------
create table if not exists public.journal_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  entry_date      date not null,
  title           text,
  bias            text check (bias in ('Bullish','Bearish','Neutral') or bias is null),
  mood            text check (mood in ('great','good','neutral','bad','terrible') or mood is null),
  rating          int  check (rating between 0 and 5),
  plan            text,
  notes           text,
  setups          text[] default '{}',
  sessions        text[] default '{}',
  rules_followed  boolean,
  improvement     text,
  tags            text[] default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index if not exists journal_user_date_idx on public.journal_entries(user_id, entry_date desc);

-- 5. COOLDOWNS TABLE ----------------------------------------------------------
create table if not exists public.cooldowns (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  reason          text,
  starts_at       timestamptz not null default now(),
  ends_at         timestamptz not null,
  created_by      uuid references public.profiles(id),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists cooldowns_user_idx   on public.cooldowns(user_id);
create index if not exists cooldowns_active_idx on public.cooldowns(is_active, ends_at) where is_active = true;

-- 6. COOLDOWN RULES (admin-set global rules) ---------------------------------
create table if not exists public.cooldown_rules (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  trigger_type      text not null check (trigger_type in ('after_loss','daily_limit','consecutive_losses','custom')),
  threshold         int  not null default 1,
  duration_minutes  int  not null default 120,
  is_enabled        boolean not null default true,
  created_at        timestamptz not null default now()
);

-- 7. USER SETTINGS TABLE ------------------------------------------------------
create table if not exists public.user_settings (
  user_id         uuid primary key references public.profiles(id) on delete cascade,
  timezone        text default 'America/New_York',
  default_currency text default 'USD',
  show_commissions boolean default true,
  accent_color    text default '#8b5cf6',
  notification_email boolean default true,
  notification_in_app boolean default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 8. SUBSCRIPTIONS TABLE ------------------------------------------------------
create table if not exists public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid unique not null references public.profiles(id) on delete cascade,
  stripe_customer_id       text unique,
  stripe_subscription_id   text unique,
  status                   text not null default 'inactive'
                           check (status in ('inactive','trialing','active','past_due','canceled','unpaid')),
  plan                     text not null default 'free' check (plan in ('free','pro','premium')),
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on public.subscriptions(user_id);

-- 9. ADMIN AUDIT LOG ----------------------------------------------------------
create table if not exists public.admin_logs (
  id              uuid primary key default gen_random_uuid(),
  admin_id        uuid references public.profiles(id),
  action          text not null,
  target_user_id  uuid references public.profiles(id),
  details         jsonb,
  created_at      timestamptz not null default now()
);

-- 10. AUTO-CREATE PROFILE TRIGGER --------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  -- also create a default settings row
  insert into public.user_settings (user_id) values (new.id) on conflict (user_id) do nothing;

  -- and a default subscription row (free plan)
  insert into public.subscriptions (user_id, status, plan) values (new.id, 'inactive', 'free')
    on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 11. UPDATE TIMESTAMP TRIGGERS ----------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_updated on public.profiles;
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists journal_updated on public.journal_entries;
create trigger journal_updated before update on public.journal_entries
  for each row execute function public.set_updated_at();

drop trigger if exists settings_updated on public.user_settings;
create trigger settings_updated before update on public.user_settings
  for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_updated on public.subscriptions;
create trigger subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- 12. ROW LEVEL SECURITY ------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.accounts         enable row level security;
alter table public.trades           enable row level security;
alter table public.journal_entries  enable row level security;
alter table public.cooldowns        enable row level security;
alter table public.cooldown_rules   enable row level security;
alter table public.user_settings    enable row level security;
alter table public.subscriptions    enable row level security;
alter table public.admin_logs       enable row level security;

-- helper functions (security definer to avoid recursion in policies)
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_staff()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','moderator'));
$$;

-- PROFILES policies
drop policy if exists "users read own profile"     on public.profiles;
create policy "users read own profile"     on public.profiles for select using (auth.uid() = id);
drop policy if exists "users update own profile"   on public.profiles;
create policy "users update own profile"   on public.profiles for update using (auth.uid() = id);
drop policy if exists "staff read all profiles"    on public.profiles;
create policy "staff read all profiles"    on public.profiles for select using (public.is_staff());
drop policy if exists "admins update all profiles" on public.profiles;
create policy "admins update all profiles" on public.profiles for update using (public.is_admin());
drop policy if exists "admins delete profiles"     on public.profiles;
create policy "admins delete profiles"     on public.profiles for delete using (public.is_admin());

-- ACCOUNTS policies
drop policy if exists "users manage own accounts" on public.accounts;
create policy "users manage own accounts" on public.accounts for all using (auth.uid() = user_id);
drop policy if exists "staff read all accounts"   on public.accounts;
create policy "staff read all accounts"   on public.accounts for select using (public.is_staff());
drop policy if exists "admins manage all accounts" on public.accounts;
create policy "admins manage all accounts" on public.accounts for all using (public.is_admin());

-- TRADES policies
drop policy if exists "users manage own trades"   on public.trades;
create policy "users manage own trades"   on public.trades for all using (auth.uid() = user_id);
drop policy if exists "staff read all trades"     on public.trades;
create policy "staff read all trades"     on public.trades for select using (public.is_staff());
drop policy if exists "admins manage all trades"  on public.trades;
create policy "admins manage all trades"  on public.trades for all using (public.is_admin());

-- JOURNAL ENTRIES policies
drop policy if exists "users manage own journal"  on public.journal_entries;
create policy "users manage own journal"  on public.journal_entries for all using (auth.uid() = user_id);
drop policy if exists "staff read all journal"    on public.journal_entries;
create policy "staff read all journal"    on public.journal_entries for select using (public.is_staff());

-- COOLDOWNS policies
drop policy if exists "users read own cooldowns"  on public.cooldowns;
create policy "users read own cooldowns"  on public.cooldowns for select using (auth.uid() = user_id);
drop policy if exists "staff manage cooldowns"    on public.cooldowns;
create policy "staff manage cooldowns"    on public.cooldowns for all using (public.is_staff());

-- COOLDOWN RULES (admin manage; everyone reads enabled ones)
drop policy if exists "admins manage cooldown rules" on public.cooldown_rules;
create policy "admins manage cooldown rules" on public.cooldown_rules for all using (public.is_admin());
drop policy if exists "everyone reads enabled rules" on public.cooldown_rules;
create policy "everyone reads enabled rules" on public.cooldown_rules for select using (is_enabled = true);

-- USER SETTINGS
drop policy if exists "users manage own settings" on public.user_settings;
create policy "users manage own settings" on public.user_settings for all using (auth.uid() = user_id);
drop policy if exists "staff read all settings"   on public.user_settings;
create policy "staff read all settings"   on public.user_settings for select using (public.is_staff());

-- SUBSCRIPTIONS
drop policy if exists "users read own subscription" on public.subscriptions;
create policy "users read own subscription" on public.subscriptions for select using (auth.uid() = user_id);
drop policy if exists "staff read all subscriptions" on public.subscriptions;
create policy "staff read all subscriptions" on public.subscriptions for select using (public.is_staff());
-- (writes happen via service role through Stripe webhook, so no INSERT/UPDATE policy for users)

-- ADMIN LOGS
drop policy if exists "admins read logs" on public.admin_logs;
create policy "admins read logs" on public.admin_logs for select using (public.is_admin());

-- 13. SEED YOUR FIRST ADMIN ---------------------------------------------------
-- After signing up your first user via /signup, promote them by running:
-- update public.profiles set role = 'admin' where email = 'you@example.com';
