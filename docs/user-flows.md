# User flows

## F1 — First-time setup (both partners)

1. Partner A opens the app → `/login` → enters email → receives magic link → lands in `/onboarding`.
2. Partner A names the household (e.g. "Casa") → gets an invite link/code → shares it with Partner B (WhatsApp, etc.).
3. Partner B opens the link → `/login` with their email → joins the same household.
4. Partner A (or B) creates categories + budgets (UC-2/UC-3), payment methods (UC-4). "Efectivo" and a default income source already exist (seeded).

## F2 — Register a spend with a card

1. Dashboard → **+** → "Gasto".
2. Enter amount → pick date (defaults to today) → description.
3. Pick category (color dot helps scanning).
4. Pick payment method. If it's a card, a hint appears immediately: **"Se paga el 5 de noviembre"** (per D7 formula).
5. Optional: toggle **"Compartido"** → adjust share % (default 50/50).
6. Save → appears in the registry list and in month/category totals.

## F3 — Register income

1. Dashboard → **+** → "Ingreso".
2. Amount, date, description, source (default preselected).
3. Save → counts toward the month's `+ $` total and the chart.

## F4 — Monthly review

1. Dashboard top: this month's spending vs income.
2. Bar chart: 6-month trend.
3. Budget list: most-depleted category first; over-budget shows >100% in a warning color.
4. Tap a category → all its entries; back → registry grouped by month.

## F5 — Split & settle

1. Partner A pays groceries $1,200 shared 50/50 → Partner B owes $600.
2. `/balance` shows "B le debe $600 a A" (net of all shared spends since last settlement).
3. Partner B transfers money outside the app → either partner taps **"Saldar"** → records a settlement of $600 → balance returns to $0.
