# Use cases

**Actors:** two partners (members of one household). Both have identical permissions.

## Configuration

- **UC-1 Create household & invite partner** — First user creates the household on onboarding and invites the second by email; the invitee joins via magic link.
- **UC-2 Manage categories** — Create/edit/archive a category with a name ("Renta", "Auto") and a color.
- **UC-3 Set category budget** — Assign one monthly amount per category ("Renta: $9,000.00 MXN"); applies to every month.
- **UC-4 Manage payment methods** — Register cash or card labels. Cards carry `cut_day` and `due_day` (day of month, repeat monthly). No card numbers.
- **UC-5 Manage income sources** — v1 seeds a single default source; schema supports multiple.

## Daily use

- **UC-6 Register a spend** — Amount (MXN), date (datepicker, defaults to today), description, category, payment method. If the method is a card, the form shows when it will be paid: `day(date) < cut_day` → due `due_day` this month, else next month.
- **UC-7 Register income** — Amount, date, description, source.
- **UC-8 Register a shared spend** — Like UC-6, plus "compartido" toggle and payer share % (default 50/50). The app tracks who paid and who owes what.
- **UC-9 Settle up** — View the running balance (who owes whom) and record a settlement payment that zeroes/reduces the debt.

## Review

- **UC-10 Month summary** — Current month spending (`- $00,000.00 MXN`) and income (`+ $00,000.00 MXN`).
- **UC-11 Income vs spending chart** — Bar chart comparing the last 6 months.
- **UC-12 Budget progress** — Collapsible list of categories with budget and current-month progress, sorted most-full → least-full; clicking a category opens its entries.
- **UC-13 Browse registry** — All entries grouped by month of registration: description, amount, payment method.
- **UC-14 Category detail** — All entries of one category.
