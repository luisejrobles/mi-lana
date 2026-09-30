"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/household";

const schema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(50),
  type: z.enum(["cash", "card"]),
  cut_day: z.string().trim(),
  due_day: z.string().trim(),
});

export type PaymentMethodFormState = { error: string | null };

function parseDay(value: string): number | null {
  if (value === "") return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 31) return null;
  return parsed;
}

async function requireMembership() {
  const membership = await getMembership();
  if (!membership) throw new Error("Sin hogar");
  return membership;
}

function validate(formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    cut_day: formData.get("cut_day") ?? "",
    due_day: formData.get("due_day") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  if (parsed.data.type === "cash") {
    return { values: { ...parsed.data, cut_day: null, due_day: null } };
  }

  const cutDay = parseDay(parsed.data.cut_day);
  const dueDay = parseDay(parsed.data.due_day);
  if (cutDay === null || dueDay === null) {
    return { error: "Los días de corte y pago deben estar entre 1 y 31" };
  }
  return { values: { ...parsed.data, cut_day: cutDay, due_day: dueDay } };
}

export async function createPaymentMethod(
  _prev: PaymentMethodFormState,
  formData: FormData,
): Promise<PaymentMethodFormState> {
  const result = validate(formData);
  if ("error" in result) return { error: result.error ?? "Datos inválidos" };

  const membership = await requireMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("payment_methods").insert({
    household_id: membership.household_id,
    name: result.values.name,
    type: result.values.type,
    cut_day: result.values.cut_day,
    due_day: result.values.due_day,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe un método con ese nombre"
          : "No se pudo crear",
    };
  }

  revalidatePath("/payment-methods");
  return { error: null };
}

export async function updatePaymentMethod(
  paymentMethodId: string,
  _prev: PaymentMethodFormState,
  formData: FormData,
): Promise<PaymentMethodFormState> {
  const result = validate(formData);
  if ("error" in result) return { error: result.error ?? "Datos inválidos" };

  const membership = await requireMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("payment_methods")
    .update({
      name: result.values.name,
      cut_day: result.values.cut_day,
      due_day: result.values.due_day,
    })
    .eq("id", paymentMethodId)
    .eq("household_id", membership.household_id);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe un método con ese nombre"
          : "No se pudo guardar",
    };
  }

  revalidatePath("/payment-methods");
  return { error: null };
}

export async function archivePaymentMethod(paymentMethodId: string) {
  const membership = await requireMembership();
  const supabase = await createClient();

  await supabase
    .from("payment_methods")
    .update({ archived: true })
    .eq("id", paymentMethodId)
    .eq("household_id", membership.household_id);

  revalidatePath("/payment-methods");
}
