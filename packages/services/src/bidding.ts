import type { OpportunityStatus } from "@bidspace/core";
import { ValidationError } from "./errors.js";

// Pure, persistence-free guard for whether a bid may be placed. Full bid
// placement (Phase 6) is blocked on open decisions O1 (fee %) and O2 (bid
// visibility), but this minimum/eligibility rule is safe to land now and is
// unit-tested without a database.
export interface BidEligibilityInput {
  opportunityStatus: OpportunityStatus;
  amountCents: number;
  minimumBidCents: number | null;
}

export function assertBidAcceptable(input: BidEligibilityInput): void {
  if (input.opportunityStatus !== "receiving_bids") {
    throw new ValidationError(
      `Opportunity is not accepting bids (status: ${input.opportunityStatus})`,
    );
  }
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new ValidationError("Bid amount must be a positive integer number of cents");
  }
  if (input.minimumBidCents != null && input.amountCents < input.minimumBidCents) {
    throw new ValidationError(
      `Bid of ${input.amountCents} cents is below the minimum of ${input.minimumBidCents} cents`,
    );
  }
}
