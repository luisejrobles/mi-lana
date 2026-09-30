import { createClient } from "@/lib/supabase/server";
import type { Household } from "@/lib/types";

export type Membership = {
  household_id: string;
  role: "owner" | "member";
  user_id: string;
  household: Household;
};

// Returns the current user's household membership (v1: one household per
// user), or null when signed out / not onboarded yet.
export async function getMembership(): Promise<Membership | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("household_members")
    .select("household_id, role, user_id, households(id, name, invite_code, created_at)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;

  const household = Array.isArray(data.households)
    ? data.households[0]
    : data.households;

  return {
    household_id: data.household_id,
    role: data.role,
    user_id: data.user_id,
    household: household as Household,
  };
}
