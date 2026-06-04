// Money is always stored and computed in integer cents (bigint at the DB layer)
// to avoid float drift and to stay aligned with Stripe's minor-unit API (D020).

export interface Money {
  amountCents: number;
  currency: string;
}

// Default platform commission in basis points (1 bps = 0.01%).
// 1000 bps = 10% — locked in D018 (see docs/DECISIONS.md). Override per-category
// or per-deal as the marketplace matures.
export const DEFAULT_PLATFORM_FEE_BPS = 1000;

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatMoney(cents: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}

// Platform fee is parameterized in basis points (1 bps = 0.01%). Defaults to
// DEFAULT_PLATFORM_FEE_BPS (10%, D018) but accepts an override for flexibility.
export function platformFeeCents(
  amountCents: number,
  feeBps: number = DEFAULT_PLATFORM_FEE_BPS,
): number {
  return Math.round((amountCents * feeBps) / 10_000);
}

export function hostPayoutCents(
  amountCents: number,
  feeBps: number = DEFAULT_PLATFORM_FEE_BPS,
): number {
  return amountCents - platformFeeCents(amountCents, feeBps);
}
