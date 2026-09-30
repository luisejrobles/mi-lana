# Known limitations (v1)

Deliberate scope cuts and accepted trade-offs. Each entry notes the likely future fix.

1. **One household per user.** Joining a second household is not supported. → Multi-household switcher in a future plan.
2. **Budgets repeat identically every month.** No per-month overrides (e.g. December is different). → `budgets` table with effective-month rows.
3. **Card due-date formula is an approximation.** `day(date) < cut_day → this month, else next month` (D7). Real cards whose due day precedes the cut day, or with grace-period nuances, are approximated. → Per-card due-day offset configuration.
4. **No recurring transactions.** Rent must be entered each month. → Recurring rules + auto-generation.
5. **No receipt/photo attachments.** → Supabase Storage bucket.
6. **No FX conversion.** Multi-currency is storage/format-ready (D2) but totals assume one currency per household. → Exchange-rate table.
7. **Web only, no offline/PWA.** Requires connectivity. → PWA manifest + service worker.
8. **No edit/delete UI polish for transactions in v1 dashboard** beyond basic correction. → Full edit flows.
9. **Balances are household-net, not per-category.** Split tracking nets everything into one number between the two members. → Per-category balances if ever needed.
10. **Magic link requires email access on the same device/browser profile** (Supabase default). → OAuth providers as alternative.
