export const MARKETPLACE_STATE = {
  phase: "founder_preview",
  isLive: false,
  paymentsEnabled: false,
  legalCommitmentsEnabled: false,
} as const;

export const MARKETPLACE_NOTICE =
  "Founder preview — spaces, bids, and applications are for product testing. No payments or binding placements are active.";

export function assertPaymentsEnabled(): void {
  if (!MARKETPLACE_STATE.paymentsEnabled) {
    throw new Error(
      "BidSpace payments are founder-gated and disabled in this product phase.",
    );
  }
}

