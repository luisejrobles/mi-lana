-- 0001_initial_schema.sql
-- Mi Lana — initial schema. All tables are household-scoped (see docs/decisions.md D3).
-- Apply via Supabase SQL editor, before 0002_rls_and_functions.sql.

-- ---------- Households & members ----------

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Short code shared with the partner to join (F1). Unique, regenerable.
  invite_code text not null unique default substr(gen_random_uuid()::text, 1, 8),
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- ---------- Categories & budgets ----------

create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  color text not null, -- hex, e.g. '#22c55e'
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

-- One monthly budget per category, repeats every month (D5).
create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null unique references categories(id) on delete cascade,
  amount_cents bigint not null check (amount_cents >= 0),
  currency char(3) not null default 'MXN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Payment methods (labels only, D4) ----------

create table payment_methods (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  type text not null check (type in ('cash', 'card')),
  name text not null, -- 'Efectivo', 'TDC Revolut', ...
  cut_day smallint check (cut_day between 1 and 31),
  due_day smallint check (due_day between 1 and 31),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (household_id, name),
  -- Cards must define cut/due days; cash must not.
  check (
    (type = 'card' and cut_day is not null and due_day is not null)
    or (type = 'cash' and cut_day is null and due_day is null)
  )
);

-- ---------- Income sources ----------

create table income_sources (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

-- ---------- Transactions ----------

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  type text not null check (type in ('spend', 'income')),
  amount_cents bigint not null check (amount_cents > 0), -- D2: integer cents
  currency char(3) not null default 'MXN',
  date date not null,
  description text not null default '',
  -- Spends
  category_id uuid references categories(id), -- NO ACTION: archive instead of delete when in use
  payment_method_id uuid references payment_methods(id),
  -- Income
  income_source_id uuid references income_sources(id),
  -- Split tracking (D3)
  paid_by uuid not null references auth.users(id),
  is_shared boolean not null default false,
  payer_share_pct smallint check (payer_share_pct between 0 and 100),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  -- Shape depends on type.
  check (
    (type = 'spend' and category_id is not null and payment_method_id is not null and income_source_id is null)
    or (type = 'income' and income_source_id is not null and category_id is null and payment_method_id is null)
  ),
  -- Shared spends must declare the payer's share.
  check (not is_shared or payer_share_pct is not null)
);

-- ---------- Settlements (D3) ----------

create table settlements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  from_user uuid not null references auth.users(id),
  to_user uuid not null references auth.users(id),
  amount_cents bigint not null check (amount_cents > 0),
  currency char(3) not null default 'MXN',
  date date not null,
  note text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);

-- ---------- Indexes ----------

create index categories_household_idx on categories (household_id);
create index budgets_household_idx on budgets (household_id);
create index payment_methods_household_idx on payment_methods (household_id);
create index income_sources_household_idx on income_sources (household_id);
create index transactions_household_date_idx on transactions (household_id, date desc);
create index transactions_category_idx on transactions (category_id);
create index settlements_household_idx on settlements (household_id);
