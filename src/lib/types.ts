// Database entity types (mirror supabase/migrations/0001_initial_schema.sql).
// If the schema changes, update these by hand until we generate types from the CLI.

export type Household = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

export type HouseholdMember = {
  household_id: string;
  user_id: string;
  role: "owner" | "member";
  display_name: string | null;
  joined_at: string;
};

export type Category = {
  id: string;
  household_id: string;
  name: string;
  color: string; // hex
  archived: boolean;
  created_at: string;
};

export type Budget = {
  id: string;
  household_id: string;
  category_id: string;
  amount_cents: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type PaymentMethod = {
  id: string;
  household_id: string;
  type: "cash" | "card";
  name: string;
  cut_day: number | null;
  due_day: number | null;
  archived: boolean;
  created_at: string;
};

export type IncomeSource = {
  id: string;
  household_id: string;
  name: string;
  archived: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  household_id: string;
  type: "spend" | "income";
  amount_cents: number;
  currency: string;
  date: string; // ISO date
  description: string;
  category_id: string | null;
  payment_method_id: string | null;
  income_source_id: string | null;
  paid_by: string;
  is_shared: boolean;
  payer_share_pct: number | null;
  created_by: string;
  created_at: string;
};

export type Settlement = {
  id: string;
  household_id: string;
  from_user: string;
  to_user: string;
  amount_cents: number;
  currency: string;
  date: string;
  note: string;
  created_by: string;
  created_at: string;
};
