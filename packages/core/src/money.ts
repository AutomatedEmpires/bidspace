// Money is always stored and computed in integer cents to avoid float drift.

export interface Money {
  amountCents: number;
  currency: string;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatMoney(cents: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}

// Platform fee is parameterized in basis points (1 bps = 0.01%) because the
// exact platform fee percentage is still an open decision (O1 in docs/DECISIONS.md).
export function platformFeeCents(amountCents: number, feeBps: number): number {
  return Math.round((amountCents * feeBps) / 10_000);
}

export function hostPayoutCents(amountCents: number, feeBps: number): number {
  return amountCents - platformFeeCents(amountCents, feeBps);
}
