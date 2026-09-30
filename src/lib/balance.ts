// Split-tracking math (D3). Pure functions — no I/O.

export type SharedSpendRow = {
  paid_by: string;
  amount_cents: number;
  payer_share_pct: number | null;
};

export type SettlementRow = {
  from_user: string;
  to_user: string;
  amount_cents: number;
};

// Net balance from `userId`'s perspective, in cents:
//   positive → the partner owes `userId`
//   negative → `userId` owes the partner
export function computeNetBalanceCents(
  sharedSpends: SharedSpendRow[],
  settlements: SettlementRow[],
  userId: string,
): number {
  let balance = 0;

  for (const spend of sharedSpends) {
    const pct = spend.payer_share_pct ?? 100;
    const otherShare = Math.round((spend.amount_cents * (100 - pct)) / 100);
    if (spend.paid_by === userId) {
      balance += otherShare; // partner owes me their share
    } else {
      balance -= otherShare; // I owe the partner their share
    }
  }

  for (const settlement of settlements) {
    if (settlement.from_user === userId) {
      balance += settlement.amount_cents; // I paid back → my debt shrinks
    } else if (settlement.to_user === userId) {
      balance -= settlement.amount_cents; // partner paid back → their debt shrinks
    }
  }

  return balance;
}
