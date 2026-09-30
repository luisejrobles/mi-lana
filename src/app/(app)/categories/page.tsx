import { redirect } from "next/navigation";
import { getMembership } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { CategoryManager, type CategoryRow } from "./category-manager";

export default async function CategoriesPage() {
  const membership = await getMembership();
  if (!membership) redirect("/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, color, budgets(id, amount_cents, currency)")
    .eq("archived", false)
    .order("name");

  const categories: CategoryRow[] = (data ?? []).map(
    ({ budgets, ...category }) => ({
      ...category,
      budget: Array.isArray(budgets) ? (budgets[0] ?? null) : budgets,
    }),
  );

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Categorías</h1>
      <CategoryManager categories={categories} />
    </section>
  );
}
