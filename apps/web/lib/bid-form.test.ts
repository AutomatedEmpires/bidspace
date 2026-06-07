import assert from "node:assert/strict";
import { test } from "node:test";
import { ValidationError } from "@bidspace/services";
import { buildBidCreateInput, getBidAvailabilityError, parseDollarsToCents } from "./bid-form";

test("parseDollarsToCents converts dollars to integer cents", () => {
  assert.equal(parseDollarsToCents("125"), 12_500);
  assert.equal(parseDollarsToCents("125.5"), 12_550);
  assert.equal(parseDollarsToCents("125.55"), 12_555);
  assert.equal(parseDollarsToCents(" 125.55 "), 12_555);
});

test("parseDollarsToCents rejects invalid dollar values", () => {
  assert.throws(() => parseDollarsToCents(""), ValidationError);
  assert.throws(() => parseDollarsToCents("0"), ValidationError);
  assert.throws(() => parseDollarsToCents("1.999"), ValidationError);
  assert.throws(() => parseDollarsToCents("abc"), ValidationError);
});

test("buildBidCreateInput validates and shapes bid input", () => {
  const parsed = buildBidCreateInput({
    bidderOrganizationId: "00000000-0000-0000-0000-000000000001",
    opportunityId: "00000000-0000-0000-0000-000000000002",
    inventoryUnitId: "00000000-0000-0000-0000-000000000003",
    amountDollars: "250.00",
    commerceLayer: "brand_exposure",
    intendedUse: " Main stage placement ",
  });

  assert.equal(parsed.amountCents, 25_000);
  assert.equal(parsed.commerceLayer, "brand_exposure");
  assert.equal(parsed.intendedUse, "Main stage placement");
});

test("getBidAvailabilityError returns message when opportunity cannot receive bids", () => {
  const errorMessage = getBidAvailabilityError("closed", 1_000);
  assert.match(errorMessage ?? "", /not accepting bids/i);
});
