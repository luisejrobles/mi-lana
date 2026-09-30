"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/household";
import { pesosToCents } from "@/lib/money";

const categorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido"),
  // Empty string = no budget.
  budget: z.string().trim(),
});

export type CategoryFormState = { error: string | null };

async function requireMembership() {
  const membership = await getMembership();
  if (!membership) throw new Error("Sin hogar");
  return membership;
}

export async function createCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    budget: formData.get("budget") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const budgetCents =
    parsed.data.budget === "" ? null : pesosToCents(parsed.data.budget);
  if (parsed.data.budget !== "" && budgetCents === null) {
    return { error: "Presupuesto inválido" };
  }

  const membership = await requireMembership();
  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from("categories")
    .insert({
      household_id: membership.household_id,
      name: parsed.data.name,
      color: parsed.data.color,
    })
    .select("id")
    .single();

  if (error) {
    return {
      error: error.code === "23505" ? "Ya existe esa categoría" : "No se pudo crear",
    };
  }

  if (budgetCents !== null) {
    const { error: budgetError } = await supabase.from("budgets").insert({
      household_id: membership.household_id,
      category_id: category.id,
      amount_cents: budgetCents,
    });
    if (budgetError) return { error: "Categoría creada, pero falló el presupuesto" };
  }

  revalidatePath("/categories");
  return { error: null };
}

export async function updateCategory(
  categoryId: string,
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    budget: formData.get("budget") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const budgetCents =
    parsed.data.budget === "" ? null : pesosToCents(parsed.data.budget);
  if (parsed.data.budget !== "" && budgetCents === null) {
    return { error: "Presupuesto inválido" };
  }

  const membership = await requireMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.data.name, color: parsed.data.color })
    .eq("id", categoryId)
    .eq("household_id", membership.household_id);

  if (error) {
    return {
      error: error.code === "23505" ? "Ya existe esa categoría" : "No se pudo guardar",
    };
  }

  if (budgetCents === null) {
    await supabase.from("budgets").delete().eq("category_id", categoryId);
  } else {
    const { error: budgetError } = await supabase.from("budgets").upsert(
      {
        household_id: membership.household_id,
        category_id: categoryId,
        amount_cents: budgetCents,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "category_id" },
    );
    if (budgetError) return { error: "Categoría guardada, pero falló el presupuesto" };
  }

  revalidatePath("/categories");
  return { error: null };
}

export async function archiveCategory(categoryId: string) {
  const membership = await requireMembership();
  const supabase = await createClient();

  await supabase
    .from("categories")
    .update({ archived: true })
    .eq("id", categoryId)
    .eq("household_id", membership.household_id);

  revalidatePath("/categories");
}
