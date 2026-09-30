import { redirect } from "next/navigation";
import { getMembership } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { computeNetBalanceCents } from "@/lib/balance";
import { formatShortDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettleForm } from "./settle-form";

export default async function BalancePage() {
  const membership = await getMembership();
  if (!membership) redirect("/onboarding");

  const supabase = await createClient();
  const [
    { data: members },
    { data: sharedSpends },
    { data: settlements },
  ] = await Promise.all([
    supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", membership.household_id),
    supabase
      .from("transactions")
      .select("paid_by, amount_cents, payer_share_pct")
      .eq("type", "spend")
      .eq("is_shared", true),
    supabase
      .from("settlements")
      .select("from_user, to_user, amount_cents, date, note")
      .order("date", { ascending: false }),
  ]);

  const partner = (members ?? []).find((m) => m.user_id !== membership.user_id);
  const balanceCents = computeNetBalanceCents(
    sharedSpends ?? [],
    settlements ?? [],
    membership.user_id,
  );

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Balance</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Gastos compartidos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!partner ? (
            <p className="text-sm text-muted-foreground">
              Cuando tu pareja se una al hogar, aquí verás el balance de los
              gastos compartidos.
            </p>
          ) : balanceCents === 0 ? (
            <p className="text-2xl font-semibold">Están a mano 🎉</p>
          ) : (
            <>
              <p className="text-2xl font-semibold">
                {balanceCents > 0
                  ? `Tu pareja te debe ${formatMoney(balanceCents)}`
                  : `Le debes ${formatMoney(-balanceCents)} a tu pareja`}
              </p>
              <div>
                <SettleForm
                  balanceCents={Math.abs(balanceCents)}
                  fromUser={
                    balanceCents > 0 ? partner.user_id : membership.user_id
                  }
                  toUser={
                    balanceCents > 0 ? membership.user_id : partner.user_id
                  }
                  fromLabel={balanceCents > 0 ? "Tu pareja" : "Tú"}
                  toLabel={balanceCents > 0 ? "ti" : "tu pareja"}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Pagos registrados</h2>
        {(settlements ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay pagos registrados.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(settlements ?? []).map((settlement, index) => (
              <li key={index}>
                <Card>
                  <CardContent className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="font-medium">
                        {settlement.from_user === membership.user_id
                          ? "Tú → tu pareja"
                          : "Tu pareja → ti"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatShortDate(settlement.date)}
                        {settlement.note ? ` · ${settlement.note}` : ""}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums">
                      {formatMoney(settlement.amount_cents)}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
