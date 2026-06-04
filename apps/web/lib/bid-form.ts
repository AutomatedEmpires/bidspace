import { bidCreateSchema, toCents, type BidCreate, type OpportunityStatus } from "@bidspace/core";
import { ValidationError, assertBidAcceptable } from "@bidspace/services";

const DOLLAR_AMOUNT_PATTERN = /^\d+(?:\.\d{1,2})?$/;
export const DEFAULT_MINIMUM_BID_CENTS = 1;

export interface BuildBidCreateInput {
  bidderOrganizationId: string;
  opportunityId: string;
  inventoryUnitId: string;
  amountDollars: string;
  commerceLayer?: string | null;
  intendedUse?: string | null;
}

export function parseDollarsToCents(amountDollars: string): number {
  const trimmedAmount = amountDollars.trim();
  if (!DOLLAR_AMOUNT_PATTERN.test(trimmedAmount)) {
    throw new ValidationError("Enter a valid dollar amount with up to 2 decimal places.");
  }

  const amountCents = toCents(Number(trimmedAmount));
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new ValidationError("Bid amount must be greater than $0.00.");
  }

  return amountCents;
}

export function buildBidCreateInput(input: BuildBidCreateInput): BidCreate {
  const parsed = bidCreateSchema.safeParse({
    bidderOrganizationId: input.bidderOrganizationId,
    opportunityId: input.opportunityId,
    inventoryUnitId: input.inventoryUnitId,
    amountCents: parseDollarsToCents(input.amountDollars),
    commerceLayer: input.commerceLayer?.trim() ? input.commerceLayer.trim() : undefined,
    intendedUse: input.intendedUse?.trim() ? input.intendedUse.trim() : undefined,
  });

  if (!parsed.success) {
    throw new ValidationError("Invalid bid input", parsed.error.flatten());
  }

  return parsed.data;
}

export function getBidAvailabilityError(
  opportunityStatus: OpportunityStatus,
  minimumBidCents: number | null,
): string | null {
  try {
    assertBidAcceptable({
      opportunityStatus,
      amountCents: minimumBidCents ?? DEFAULT_MINIMUM_BID_CENTS,
      minimumBidCents,
    });
    return null;
  } catch (error) {
    if (error instanceof ValidationError) {
      return error.message;
    }
    throw error;
  }
}
