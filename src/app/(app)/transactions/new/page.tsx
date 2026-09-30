import { redirect } from "next/navigation";
import { getMembership } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpendForm } from "./spend-form";
import { IncomeForm } from "./income-form";

export default async function NewTransactionPage() {
  const membership = await getMembership();
  if (!membership) redirect("/onboarding");

  const supabase = await createClient();
  const [{ data: categories }, { data: paymentMethods }, { data: sources }] =
    await Promise.all([
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
      supabase
        .from("income_sources")
        .select("id, name")
        .eq("archived", false)
        .order("name"),
    ]);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Registrar</h1>
      <Tabs defaultValue="spend">
        <TabsList className="w-full">
          <TabsTrigger value="spend" className="flex-1">
            Gasto
          </TabsTrigger>
          <TabsTrigger value="income" className="flex-1">
            Ingreso
          </TabsTrigger>
        </TabsList>
        <TabsContent value="spend" className="pt-4">
          <SpendForm
            categories={categories ?? []}
            paymentMethods={paymentMethods ?? []}
          />
        </TabsContent>
        <TabsContent value="income" className="pt-4">
          <IncomeForm sources={sources ?? []} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
