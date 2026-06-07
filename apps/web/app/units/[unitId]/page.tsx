import type { EventRow, OpportunityRow, VenueRow } from "@bidspace/db";
import { COMMERCE_LAYER, formatMoney } from "@bidspace/core";
import {
  NotFoundError,
  ValidationError,
  getInventoryUnit,
  getOpportunity,
  listBidsForOpportunity,
  placeBid,
} from "@bidspace/services";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUserOrgContext } from "@/lib/auth-context";
import { createServerBidspaceClient } from "@/lib/bidspace-server";
import {
  buildBidCreateInput,
  DEFAULT_MINIMUM_BID_CENTS,
  getBidAvailabilityError,
} from "@/lib/bid-form";
import { hasOrgRole } from "@/lib/permissions";
import { BidSubmissionForm, type BidFormState } from "./bid-form";

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

type ActiveBidderContext = NonNullable<Awaited<ReturnType<typeof getCurrentUserOrgContext>>> & {
  activeClerkOrganizationId: string;
  activeDbOrganizationId: string;
};

function formatDateTime(value: string): string {
  return DATE_TIME_FORMAT.format(new Date(value));
}

function renderPrice(value: number | null): string {
  return value == null ? "Not set" : formatMoney(value);
}

async function requireActiveBidderContext(): Promise<ActiveBidderContext> {
  const context = await getCurrentUserOrgContext();
  if (!context) {
    redirect("/sign-in");
  }
  if (
    !context.activeClerkOrganizationId ||
    !context.activeDbOrganizationId ||
    !hasOrgRole("viewer", context.activeOrganizationRole)
  ) {
    redirect("/onboarding");
  }
  return context as ActiveBidderContext;
}

async function getUnitContext(opportunity: OpportunityRow): Promise<{
  venue: VenueRow | null;
  event: EventRow | null;
}> {
  const db = createServerBidspaceClient();

  let venue: VenueRow | null = null;
  if (opportunity.venue_id) {
    const venueResult = await db.from("venues").select("*").eq("id", opportunity.venue_id).maybeSingle();
    if (venueResult.error) {
      throw venueResult.error;
    }
    venue = venueResult.data;
  }

  let event: EventRow | null = null;
  if (opportunity.event_id) {
    const eventResult = await db.from("events").select("*").eq("id", opportunity.event_id).maybeSingle();
    if (eventResult.error) {
      throw eventResult.error;
    }
    event = eventResult.data;
  }

  return { venue, event };
}

async function getUnitOrNotFound(unitId: string) {
  const db = createServerBidspaceClient();
  try {
    return await getInventoryUnit(db, unitId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const context = await requireActiveBidderContext();

  const { unitId } = await params;
  const db = createServerBidspaceClient();
  const unit = await getUnitOrNotFound(unitId);

  const opportunity = await getOpportunity(db, unit.opportunity_id);
  const { venue, event } = await getUnitContext(opportunity);
  const minimumBidCents = unit.minimum_bid_cents ?? opportunity.minimum_bid_cents;
  const bidAvailabilityError = getBidAvailabilityError(opportunity.status, minimumBidCents);
  const yourBids = (await listBidsForOpportunity(db, opportunity.id, {
    organizationId: context.activeDbOrganizationId,
    isHost: false,
  }))
    .filter((bid) => bid.inventory_unit_id === unit.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  async function submitBidAction(_state: BidFormState, formData: FormData): Promise<BidFormState> {
    "use server";

    const currentContext = await requireActiveBidderContext();

    try {
      const serverDb = createServerBidspaceClient();
      const currentUnit = await getInventoryUnit(serverDb, unitId);
      const bidInput = buildBidCreateInput({
        bidderOrganizationId: currentContext.activeDbOrganizationId,
        opportunityId: currentUnit.opportunity_id,
        inventoryUnitId: currentUnit.id,
        amountDollars: String(formData.get("amountDollars") ?? ""),
        commerceLayer: formData.get("commerceLayer") as string | null,
        intendedUse: formData.get("intendedUse") as string | null,
      });

      await placeBid(serverDb, bidInput);
      revalidatePath(`/units/${unitId}`);
      return { status: "success", message: "Bid submitted." };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { status: "error", message: error.message };
      }
      return { status: "error", message: "Unable to submit bid right now. Please try again." };
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", display: "grid", gap: 20 }}>
      <header>
        <h1>{unit.name}</h1>
        <p>
          Type: {unit.type} · Status: {unit.status}
        </p>
      </header>

      <section style={{ display: "grid", gap: 8 }}>
        <h2>Availability</h2>
        <p>
          {formatDateTime(unit.availability_start)} to {formatDateTime(unit.availability_end)}
        </p>
        <p>Location: {venue ? `${venue.city}, ${venue.state}` : "Not linked"}</p>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h2>Pricing</h2>
        <p>Minimum bid: {renderPrice(minimumBidCents)}</p>
        <p>Buy now: {renderPrice(unit.buy_now_price_cents)}</p>
        <p>Reserve: {renderPrice(unit.reserve_price_cents)}</p>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h2>Opportunity context</h2>
        <p>
          Opportunity: {opportunity.title} ({opportunity.status})
        </p>
        <p>Opportunity minimum bid: {renderPrice(opportunity.minimum_bid_cents)}</p>
        <p>Opportunity pricing mode: {opportunity.pricing_mode}</p>
        {venue ? <p>Venue: {venue.name}</p> : <p>Venue: Not linked</p>}
        {event ? <p>Event: {event.name}</p> : <p>Event: Not linked</p>}
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h2>Place your bid</h2>
        <p>
          Enter amount in dollars. Stored as integer cents (minimum currently{" "}
          {minimumBidCents != null
            ? formatMoney(minimumBidCents)
            : formatMoney(DEFAULT_MINIMUM_BID_CENTS)}
          ).
        </p>
        <BidSubmissionForm
          action={submitBidAction}
          canSubmit={!bidAvailabilityError}
          disabledReason={bidAvailabilityError}
          minimumBidCents={minimumBidCents}
          commerceLayers={COMMERCE_LAYER}
        />
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h2>Your current bids for this unit</h2>
        {yourBids.length === 0 ? (
          <p>You have not placed a bid for this unit yet.</p>
        ) : (
          <ul style={{ display: "grid", gap: 6, paddingLeft: 20 }}>
            {yourBids.map((bid) => (
              <li key={bid.id}>
                {formatMoney(bid.amount_cents)} · {bid.status} · {formatDateTime(bid.created_at)}
              </li>
            ))}
          </ul>
        )}
        <p style={{ color: "#6b7280" }}>TODO(phase-7-host): attach host incoming-bid pipeline UI here.</p>
      </section>
    </main>
  );
}
