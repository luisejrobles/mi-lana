-- 0002_rls_and_functions.sql
-- Mi Lana — Row Level Security, helper functions, onboarding RPCs, and
-- per-household seed data ("Efectivo", default income source).
-- Apply via Supabase SQL editor, after 0001_initial_schema.sql.

-- ---------- Helper: membership check ----------
-- security definer so RLS policies can query household_members without
-- infinite recursion. Only exposes a boolean for the *calling* user.

create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from household_members
    where household_id = p_household_id
      and user_id = auth.uid()
  );
$$;

-- ---------- Enable RLS ----------

alter table households enable row level security;
alter table household_members enable row level security;
alter table categories enable row level security;
alter table budgets enable row level security;
alter table payment_methods enable row level security;
alter table income_sources enable row level security;
alter table transactions enable row level security;
alter table settlements enable row level security;

-- ---------- Policies: households ----------
-- Writes go through the create_household / join_household RPCs (below).

create policy "members can read their household"
  on households for select
  using (public.is_household_member(id));

create policy "members can update their household"
  on households for update
  using (public.is_household_member(id))
  with check (public.is_household_member(id));

-- ---------- Policies: household_members ----------

create policy "members can read fellow members"
  on household_members for select
  using (public.is_household_member(household_id));

-- ---------- Policies: household-scoped data ----------

create policy "members manage categories"
  on categories for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "members manage budgets"
  on budgets for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "members manage payment methods"
  on payment_methods for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "members manage income sources"
  on income_sources for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "members read transactions"
  on transactions for select
  using (public.is_household_member(household_id));

create policy "members insert transactions as themselves"
  on transactions for insert
  with check (
    public.is_household_member(household_id)
    and created_by = auth.uid()
  );

create policy "members update transactions"
  on transactions for update
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "members delete transactions"
  on transactions for delete
  using (public.is_household_member(household_id));

create policy "members manage settlements"
  on settlements for all
  using (public.is_household_member(household_id))
  with check (
    public.is_household_member(household_id)
    and created_by = auth.uid()
  );

-- ---------- Onboarding RPCs ----------
-- security definer: they validate input and issue the privileged inserts
-- (household + membership + seed rows) that RLS intentionally forbids
-- via direct table writes.

-- Create a household, make the caller its owner, and seed defaults.
create or replace function public.create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- v1: one household per user (known-limitations.md #1).
  if exists (select 1 from household_members where user_id = auth.uid()) then
    raise exception 'already in a household';
  end if;

  insert into households (name)
  values (p_name)
  returning id into v_household_id;

  insert into household_members (household_id, user_id, role)
  values (v_household_id, auth.uid(), 'owner');

  -- Seed: cash payment method and a default income source.
  insert into payment_methods (household_id, type, name)
  values (v_household_id, 'cash', 'Efectivo');

  insert into income_sources (household_id, name)
  values (v_household_id, 'Ingreso');

  return v_household_id;
end;
$$;

-- Join an existing household via its invite code.
create or replace function public.join_household(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if exists (select 1 from household_members where user_id = auth.uid()) then
    raise exception 'already in a household';
  end if;

  select id into v_household_id
  from households
  where invite_code = p_invite_code;

  if v_household_id is null then
    raise exception 'invalid invite code';
  end if;

  insert into household_members (household_id, user_id, role)
  values (v_household_id, auth.uid(), 'member');

  return v_household_id;
end;
$$;
