import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getMembership } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { formatShortDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";

export default async function CategoryDetailPage(
  props: PageProps<"/categories/[id]">,
) {
  const { id } = await props.params;
  const membership = await getMembership();
  if (!membership) redirect("/onboarding");

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, color, budgets(amount_cents, currency)")
    .eq("id", id)
    .maybeSingle();
  if (!category) notFound();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, date, description, amount_cents, currency, payment_methods(name)")
    .eq("category_id", id)
    .order("date", { ascending: false })
    .limit(200);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver al resumen
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <span
            aria-hidden
            className="size-4 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          {category.name}
        </h1>
      </div>

      {(transactions ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay registros en esta categoría todavía.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {(transactions ?? []).map((tx) => {
            const paymentMethod = Array.isArray(tx.payment_methods)
              ? tx.payment_methods[0]
              : tx.payment_methods;
            return (
              <li key={tx.id}>
                <Card>
                  <CardContent className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="font-medium">
                        {tx.description || "Sin descripción"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatShortDate(tx.date)}
                        {paymentMethod ? ` · ${paymentMethod.name}` : ""}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums text-destructive">
                      - {formatMoney(tx.amount_cents, tx.currency)}
                    </p>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
