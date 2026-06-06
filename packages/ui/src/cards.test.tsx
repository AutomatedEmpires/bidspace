import assert from "node:assert/strict";
import test from "node:test";

import { renderToStaticMarkup } from "react-dom/server";

import { BookingCard, HostCard, OpportunityCard } from "./cards.js";

test("OpportunityCard renders DTO fields", () => {
  const markup = renderToStaticMarkup(
    <OpportunityCard
      dto={{
        title: "Summer Market",
        host: "City Events",
        dates: "2026-07-02 to 2026-07-04",
        pricingMode: "auction",
        minBidCents: 25000,
        location: "Austin, TX",
        unitCount: 12,
      }}
    />,
  );

  assert.match(markup, /Summer Market/);
  assert.match(markup, /\$250\.00/);
});

test("HostCard uses signal language", () => {
  const markup = renderToStaticMarkup(
    <HostCard
      dto={{
        name: "North Venue Group",
        hostScore: 89,
        hostScoreSignal: "estimated",
        verifications: ["id", "business"],
        venues: 4,
        responseSignal: "reported",
      }}
    />,
  );

  assert.match(markup, /estimated/);
  assert.match(markup, /reported/);
  assert.doesNotMatch(markup, /guaranteed|verified traffic/i);
});

test("BookingCard renders cents amount", () => {
  const markup = renderToStaticMarkup(
    <BookingCard
      dto={{
        unit: "Banner slot A1",
        dates: "2026-07-10 to 2026-07-12",
        amountCents: 9900,
        status: "booked",
        counterparty: "Acme Snacks",
      }}
    />,
  );

  assert.match(markup, /\$99\.00/);
});
