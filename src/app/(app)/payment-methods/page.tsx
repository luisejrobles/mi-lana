import { redirect } from "next/navigation";
import { getMembership } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import {
  PaymentMethodManager,
  type PaymentMethodRow,
} from "./payment-method-manager";

export default async function PaymentMethodsPage() {
  const membership = await getMembership();
  if (!membership) redirect("/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_methods")
    .select("id, type, name, cut_day, due_day")
    .eq("archived", false)
    .order("type")
    .order("name");

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Métodos de pago</h1>
      <PaymentMethodManager methods={(data ?? []) as PaymentMethodRow[]} />
    </section>
  );
}
