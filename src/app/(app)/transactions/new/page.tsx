import { redirect } from "next/navigation";
import { getMembership } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { SpendForm } from "./spend-form";

export default async function NewTransactionPage() {
  const membership = await getMembership();
  if (!membership) redirect("/onboarding");

  const supabase = await createClient();
  const [{ data: categories }, { data: paymentMethods }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, color")
      .eq("archived", false)
      .order("name"),
    supabase
      .from("payment_methods")
      .select("id, name, type, cut_day, due_day")
      .eq("archived", false)
      .order("name"),
  ]);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Registrar gasto</h1>
      <SpendForm
        categories={categories ?? []}
        paymentMethods={paymentMethods ?? []}
      />
    </section>
  );
}
