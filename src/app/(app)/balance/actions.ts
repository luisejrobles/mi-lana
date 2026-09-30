"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/household";
import { pesosToCents } from "@/lib/money";

const settlementSchema = z.object({
  amount: z.string().trim().min(1, "El monto es obligatorio"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  note: z.string().trim().max(200),
  from_user: z.string().uuid(),
  to_user: z.string().uuid(),
});

export type SettlementFormState = { error: string | null };

export async function createSettlement(
  _prev: SettlementFormState,
  formData: FormData,
): Promise<SettlementFormState> {
  const parsed = settlementSchema.safeParse({
    amount: formData.get("amount"),
    date: formData.get("date"),
    note: formData.get("note") ?? "",
    from_user: formData.get("from_user"),
    to_user: formData.get("to_user"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const amountCents = pesosToCents(parsed.data.amount);
  if (amountCents === null || amountCents <= 0) {
    return { error: "Monto inválido" };
  }

  const membership = await getMembership();
  if (!membership) throw new Error("Sin hogar");
  const supabase = await createClient();

  // Both sides must be members of this household (RLS scopes the read).
  const { data: members } = await supabase
    .from("household_members")
    .select("user_id")
    .eq("household_id", membership.household_id);
  const memberIds = new Set((members ?? []).map((m) => m.user_id));
  if (
    !memberIds.has(parsed.data.from_user) ||
    !memberIds.has(parsed.data.to_user) ||
    parsed.data.from_user === parsed.data.to_user
  ) {
    return { error: "Participantes inválidos" };
  }

  const { error } = await supabase.from("settlements").insert({
    household_id: membership.household_id,
    from_user: parsed.data.from_user,
    to_user: parsed.data.to_user,
    amount_cents: amountCents,
    currency: "MXN",
    date: parsed.data.date,
    note: parsed.data.note,
    created_by: membership.user_id,
  });

  if (error) {
    return { error: "No se pudo registrar el pago" };
  }

  revalidatePath("/balance");
  return { error: null };
}
