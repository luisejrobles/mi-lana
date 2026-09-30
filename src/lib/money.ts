// Money helpers — D2: amounts are integer cents + ISO currency code.

export function formatMoney(cents: number, currency = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

// "1234.56" -> 123456. Returns null for invalid input.
export function pesosToCents(value: string): number | null {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

// 123456 -> "1234.56" (for form inputs).
export function centsToPesos(cents: number): string {
  return (cents / 100).toFixed(2);
}
