"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/household";
import { pesosToCents } from "@/lib/money";

const spendSchema = z.object({
  amount: z.string().trim().min(1, "El monto es obligatorio"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  description: z.string().trim().max(200),
  category_id: z.string().uuid("Elige una categoría"),
  payment_method_id: z.string().uuid("Elige un método de pago"),
  is_shared: z.enum(["true", "false"]),
  payer_share_pct: z.string().trim(),
});

export type SpendFormState = { error: string | null };

export async function createSpend(
  _prev: SpendFormState,
  formData: FormData,
): Promise<SpendFormState> {
  const parsed = spendSchema.safeParse({
    amount: formData.get("amount"),
    date: formData.get("date"),
    description: formData.get("description") ?? "",
    category_id: formData.get("category_id"),
    payment_method_id: formData.get("payment_method_id"),
    is_shared: formData.get("is_shared") ?? "false",
    payer_share_pct: formData.get("payer_share_pct") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const amountCents = pesosToCents(parsed.data.amount);
  if (amountCents === null || amountCents <= 0) {
    return { error: "Monto inválido" };
  }

  const isShared = parsed.data.is_shared === "true";
  let payerSharePct: number | null = null;
  if (isShared) {
    const pct = Number.parseInt(parsed.data.payer_share_pct, 10);
    if (!Number.isInteger(pct) || pct < 0 || pct > 100) {
      return { error: "El porcentaje debe estar entre 0 y 100" };
    }
    payerSharePct = pct;
  }

  const membership = await getMembership();
  if (!membership) throw new Error("Sin hogar");
  const supabase = await createClient();

  // Guard: referenced rows must belong to this household (RLS scopes the reads).
  const [{ data: category }, { data: paymentMethod }] = await Promise.all([
    supabase
      .from("categories")
      .select("id")
      .eq("id", parsed.data.category_id)
      .maybeSingle(),
    supabase
      .from("payment_methods")
      .select("id")
      .eq("id", parsed.data.payment_method_id)
      .maybeSingle(),
  ]);
  if (!category || !paymentMethod) {
    return { error: "Categoría o método de pago inválido" };
  }

  const { error } = await supabase.from("transactions").insert({
    household_id: membership.household_id,
    type: "spend",
    amount_cents: amountCents,
    currency: "MXN",
    date: parsed.data.date,
    description: parsed.data.description,
    category_id: parsed.data.category_id,
    payment_method_id: parsed.data.payment_method_id,
    paid_by: membership.user_id,
    is_shared: isShared,
    payer_share_pct: payerSharePct,
    created_by: membership.user_id,
  });

  if (error) {
    return { error: "No se pudo registrar el gasto" };
  }

  revalidatePath("/");
  redirect("/");
}
