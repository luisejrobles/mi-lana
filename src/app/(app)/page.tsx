import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Resumen</h1>
        <Button render={<Link href="/transactions/new" />}>
          Registrar gasto
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Tu resumen mensual estará aquí pronto.
      </p>
    </section>
  );
}
