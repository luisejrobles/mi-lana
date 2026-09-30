import Link from "next/link";
import { redirect } from "next/navigation";
import { addMonths, format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { getMembership } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { formatSigned } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const membership = await getMembership();
  if (!membership) redirect("/onboarding");

  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(addMonths(startOfMonth(now), 1), "yyyy-MM-dd");

  const supabase = await createClient();
  const { data: transactions } = await supabase
    .from("transactions")
    .select("type, amount_cents")
    .gte("date", monthStart)
    .lt("date", monthEnd);

  let spentCents = 0;
  let earnedCents = 0;
  for (const tx of transactions ?? []) {
    if (tx.type === "spend") spentCents += tx.amount_cents;
    else earnedCents += tx.amount_cents;
  }

  const monthLabel = format(now, "MMMM yyyy", { locale: es });

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resumen</h1>
          <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
        </div>
        <Button render={<Link href="/transactions/new" />}>Registrar</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gastos del mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-destructive">
              {formatSigned(spentCents, "spend")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos del mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-500">
              {formatSigned(earnedCents, "income")}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
