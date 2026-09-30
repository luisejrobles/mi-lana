import Link from "next/link";
import { redirect } from "next/navigation";
import { addMonths, format, startOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown } from "lucide-react";
import { getMembership } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { formatShortDate } from "@/lib/dates";
import { formatMoney, formatSigned } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import {
  IncomeSpendingChart,
  type MonthPoint,
} from "@/components/income-spending-chart";

export default async function DashboardPage() {
  const membership = await getMembership();
  if (!membership) redirect("/onboarding");

  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(addMonths(startOfMonth(now), 1), "yyyy-MM-dd");
  const chartStart = format(startOfMonth(subMonths(now, 5)), "yyyy-MM-dd");

  const supabase = await createClient();
  const [
    { data: monthTransactions },
    { data: chartTransactions },
    { data: categories },
    { data: registry },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount_cents, category_id")
      .gte("date", monthStart)
      .lt("date", monthEnd),
    supabase
      .from("transactions")
      .select("type, amount_cents, date")
      .gte("date", chartStart)
      .lt("date", monthEnd),
    supabase
      .from("categories")
      .select("id, name, color, budgets(amount_cents, currency)")
      .eq("archived", false),
    supabase
      .from("transactions")
      .select(
        "id, type, date, description, amount_cents, currency, categories(name, color), payment_methods(name), income_sources(name)",
      )
      .order("date", { ascending: false })
      .limit(500),
  ]);

  let spentCents = 0;
  let earnedCents = 0;
  const spentByCategory = new Map<string, number>();
  for (const tx of monthTransactions ?? []) {
    if (tx.type === "spend") {
      spentCents += tx.amount_cents;
      if (tx.category_id) {
        spentByCategory.set(
          tx.category_id,
          (spentByCategory.get(tx.category_id) ?? 0) + tx.amount_cents,
        );
      }
    } else {
      earnedCents += tx.amount_cents;
    }
  }

  // Budget progress per category, most-full first (spec UC-12).
  const budgetRows = (categories ?? [])
    .map((category) => {
      const budget = Array.isArray(category.budgets)
        ? category.budgets[0]
        : category.budgets;
      if (!budget) return null;
      const spent = spentByCategory.get(category.id) ?? 0;
      const pct =
        budget.amount_cents > 0
          ? Math.round((spent / budget.amount_cents) * 100)
          : 0;
      return {
        id: category.id,
        name: category.name,
        color: category.color,
        budgetCents: budget.amount_cents,
        currency: budget.currency,
        spentCents: spent,
        pct,
      };
    })
    .filter((row) => row !== null)
    .sort((a, b) => b.pct - a.pct);

  // Last 6 months, oldest first, grouped by yyyy-MM.
  const chartData: MonthPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const month = subMonths(startOfMonth(now), i);
    const key = format(month, "yyyy-MM");
    const label = format(month, "MMM", { locale: es });
    let ingresos = 0;
    let gastos = 0;
    for (const tx of chartTransactions ?? []) {
      if (!tx.date.startsWith(key)) continue;
      if (tx.type === "spend") gastos += tx.amount_cents;
      else ingresos += tx.amount_cents;
    }
    chartData.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      ingresos: ingresos / 100,
      gastos: gastos / 100,
    });
  }

  const monthLabel = format(now, "MMMM yyyy", { locale: es });

  // Registry grouped by month of registration (spec UC-13), newest first.
  const registryGroups = new Map<string, NonNullable<typeof registry>>();
  for (const tx of registry ?? []) {
    const key = tx.date.slice(0, 7); // yyyy-MM
    const group = registryGroups.get(key);
    if (group) group.push(tx);
    else registryGroups.set(key, [tx]);
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resumen</h1>
          <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
        </div>
        <Button nativeButton={false} render={<Link href="/transactions/new" />}>
          Registrar
        </Button>
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ingresos vs gastos — últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeSpendingChart data={chartData} />
        </CardContent>
      </Card>

      <Collapsible defaultOpen>
        <Card>
          <CardHeader className="pb-2">
            <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Presupuestos del mes
              </CardTitle>
              <ChevronDown className="size-4 text-muted-foreground transition-transform [[data-panel-open]_&]:rotate-180" />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {budgetRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no tienes presupuestos. Configúralos en{" "}
                  <Link href="/categories" className="underline">
                    Categorías
                  </Link>
                  .
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {budgetRows.map((row) => (
                    <li key={row.id}>
                      <Link
                        href={`/categories/${row.id}`}
                        className="block rounded-md p-2 transition-colors hover:bg-muted"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <span
                              aria-hidden
                              className="size-3 rounded-full"
                              style={{ backgroundColor: row.color }}
                            />
                            <span className="text-sm font-medium">
                              {row.name}
                            </span>
                          </span>
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              row.pct > 100 ? "text-destructive" : ""
                            }`}
                          >
                            {row.pct}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(row.pct, 100)}
                          className="mt-1.5"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatMoney(row.spentCents, row.currency)} de{" "}
                          {formatMoney(row.budgetCents, row.currency)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Registros</h2>
        {registryGroups.size === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay registros. Empieza con el botón “Registrar”.
          </p>
        ) : (
          [...registryGroups.entries()].map(([monthKey, transactions]) => {
            const groupLabel = format(
              new Date(`${monthKey}-01T00:00:00`),
              "MMMM yyyy",
              { locale: es },
            );
            return (
              <div key={monthKey} className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-muted-foreground capitalize">
                  {groupLabel}
                </h3>
                <ul className="flex flex-col gap-2">
                  {transactions.map((tx) => {
                    const category = Array.isArray(tx.categories)
                      ? tx.categories[0]
                      : tx.categories;
                    const paymentMethod = Array.isArray(tx.payment_methods)
                      ? tx.payment_methods[0]
                      : tx.payment_methods;
                    const source = Array.isArray(tx.income_sources)
                      ? tx.income_sources[0]
                      : tx.income_sources;
                    return (
                      <li key={tx.id}>
                        <Card>
                          <CardContent className="flex items-center justify-between gap-4 py-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                aria-hidden
                                className="size-3 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    tx.type === "spend"
                                      ? (category?.color ?? "#a3a3a3")
                                      : "#16a34a",
                                }}
                              />
                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {tx.description ||
                                    category?.name ||
                                    source?.name ||
                                    "Sin descripción"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatShortDate(tx.date)}
                                  {tx.type === "spend" && paymentMethod
                                    ? ` · ${paymentMethod.name}`
                                    : ""}
                                  {tx.type === "income" && source
                                    ? ` · ${source.name}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                            <p
                              className={`shrink-0 font-semibold whitespace-nowrap tabular-nums ${
                                tx.type === "spend"
                                  ? "text-destructive"
                                  : "text-green-600 dark:text-green-500"
                              }`}
                            >
                              {formatSigned(tx.amount_cents, tx.type, tx.currency)}
                            </p>
                          </CardContent>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </section>
    </section>
  );
}
