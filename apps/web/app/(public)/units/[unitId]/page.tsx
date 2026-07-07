import Link from "next/link";
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
import {
  Badge,
  DescriptionList,
  Icon,
  Panel,
  PanelBody,
  PanelHeader,
  StatusBadge,
} from "@bidspace/ui";
import { getCurrentUserOrgContext } from "@/lib/auth-context";
import { createServerBidspaceClient } from "@/lib/bidspace-server";
import {
  buildBidCreateInput,
  DEFAULT_MINIMUM_BID_CENTS,
  getBidAvailabilityError,
} from "@/lib/bid-form";
import { hasMarketplaceRole, hasOrgRole } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import { captureServerEvent } from "@/lib/analytics-server";
import { BidSubmissionForm, type BidFormState } from "./bid-form";

type ActiveOrgContext = NonNullable<Awaited<ReturnType<typeof getCurrentUserOrgContext>>> & {
  activeClerkOrganizationId: string;
  activeDbOrganizationId: string;
};

function getBidderRoleError(roleProfiles: Parameters<typeof hasMarketplaceRole>[1]): string | null {
  return hasMarketplaceRole("bidder", roleProfiles)
    ? null
    : "Complete onboarding with a bidder role before submitting bids.";
}

async function requireActiveOrgContext(): Promise<ActiveOrgContext> {
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
  return context as ActiveOrgContext;
}

async function getUnitContext(
  unitVenueId: string | null,
  unitEventId: string | null,
  opportunity: OpportunityRow,
): Promise<{ venue: VenueRow | null; event: EventRow | null }> {
  const db = createServerBidspaceClient();
  const venueId = unitVenueId ?? opportunity.venue_id;
  const eventId = unitEventId ?? opportunity.event_id;

  let venue: VenueRow | null = null;
  if (venueId) {
    const venueResult = await db.from("venues").select("*").eq("id", venueId).maybeSingle();
    if (venueResult.error) throw venueResult.error;
    venue = venueResult.data;
  }

  let event: EventRow | null = null;
  if (eventId) {
    const eventResult = await db.from("events").select("*").eq("id", eventId).maybeSingle();
    if (eventResult.error) throw eventResult.error;
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
  const context = await requireActiveOrgContext();

  const { unitId } = await params;
  const db = createServerBidspaceClient();
  const unit = await getUnitOrNotFound(unitId);

  const opportunity = await getOpportunity(db, unit.opportunity_id);
  const { venue, event } = await getUnitContext(unit.venue_id, unit.event_id, opportunity);
  const minimumBidCents = unit.minimum_bid_cents ?? opportunity.minimum_bid_cents;
  const bidAvailabilityError =
    getBidderRoleError(context.roleProfiles) ??
    getBidAvailabilityError(opportunity.status, minimumBidCents);
  const yourBids = (
    await listBidsForOpportunity(db, opportunity.id, {
      organizationId: context.activeDbOrganizationId,
      isHost: false,
    })
  )
    .filter((bid) => bid.inventory_unit_id === unit.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  async function submitBidAction(_state: BidFormState, formData: FormData): Promise<BidFormState> {
    "use server";

    const currentContext = await requireActiveOrgContext();

    try {
      const bidderRoleError = getBidderRoleError(currentContext.roleProfiles);
      if (bidderRoleError) {
        return { status: "error", message: bidderRoleError };
      }

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

      const placed = await placeBid(serverDb, bidInput);
      captureServerEvent("bid_submitted", currentContext.activeDbOrganizationId, {
        bid_id: placed.id,
        opportunity_id: placed.opportunity_id,
        inventory_unit_id: placed.inventory_unit_id,
        amount_cents: placed.amount_cents,
      });
      revalidatePath(`/units/${unitId}`);
      return { status: "success", message: "Bid submitted. The host reviews and selects — watch your Bids page." };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { status: "error", message: error.message };
      }
      return { status: "error", message: "Unable to submit bid right now. Please try again." };
    }
  }

  const specs = [
    { term: "Dimensions", detail: unit.dimensions },
    { term: "Setting", detail: unit.indoor === true ? "Indoor" : unit.indoor === false ? "Outdoor" : null },
    { term: "Power", detail: unit.power_available === true ? "Available" : unit.power_available === false ? "Not available" : null },
    { term: "Water", detail: unit.water_available === true ? "Available" : unit.water_available === false ? "Not available" : null },
    { term: "Vehicle access", detail: unit.vehicle_access === true ? "Yes" : null },
    { term: "Setup window", detail: unit.setup_window },
    { term: "Teardown window", detail: unit.teardown_window },
    {
      term: "Required documents",
      detail: unit.required_documents.length ? unit.required_documents.join(", ") : null,
    },
    {
      term: "Category restrictions",
      detail: unit.category_restrictions.length ? unit.category_restrictions.join(", ") : null,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-ink-muted dark:text-canvas-muted" aria-label="Breadcrumb">
        <Link href="/explore" className="hover:text-ink dark:hover:text-canvas">
          Explore
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/opportunities/${opportunity.slug ?? opportunity.id}`}
          className="hover:text-ink dark:hover:text-canvas"
        >
          {opportunity.title}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink dark:text-canvas">{unit.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={unit.status} />
            <Badge tone="neutral">{unit.type.replace(/_/g, " ")}</Badge>
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {unit.name}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted dark:text-canvas-muted">
            {venue ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="pin" size={15} />
                {venue.name} · {venue.city}, {venue.state}
              </span>
            ) : null}
            {event ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="event" size={15} />
                {event.name}
              </span>
            ) : null}
          </p>

          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">Availability</h2>
            <p className="mt-2 flex items-center gap-2 text-[15px]">
              <Icon name="calendar" size={17} className="text-ink-faint dark:text-canvas-faint" />
              {formatDateTime(unit.availability_start)} — {formatDateTime(unit.availability_end)}
            </p>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">The space</h2>
            <DescriptionList className="mt-4" items={specs} />
            {unit.notes ? (
              <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-ink-soft dark:text-canvas-soft">
                {unit.notes}
              </p>
            ) : null}
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">Commercial terms</h2>
            <DescriptionList
              className="mt-4"
              items={[
                { term: "Minimum bid", detail: minimumBidCents != null ? formatMoney(minimumBidCents) : "Not set" },
                { term: "Buy now", detail: unit.buy_now_price_cents != null ? formatMoney(unit.buy_now_price_cents) : null },
                { term: "Pricing mode", detail: opportunity.pricing_mode.replace(/_/g, " ") },
                { term: "Opportunity", detail: `${opportunity.title} (${opportunity.status.replace(/_/g, " ")})` },
              ]}
            />
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">Your bids on this position</h2>
            {yourBids.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted dark:text-canvas-muted">
                You have not placed a bid for this position yet.
              </p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {yourBids.map((bid) => (
                  <li
                    key={bid.id}
                    className="flex items-center justify-between gap-3 rounded-[3px] border border-line bg-surface px-4 py-3 text-sm dark:bg-surface-dark"
                  >
                    <span className="font-semibold tabular-nums">{formatMoney(bid.amount_cents)}</span>
                    <StatusBadge status={bid.status} />
                    <span className="text-xs text-ink-muted dark:text-canvas-muted">
                      {formatDateTime(bid.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Panel>
            <PanelHeader
              kicker="Sealed bidding"
              title="Place your bid"
              actions={
                minimumBidCents != null ? (
                  <span className="font-display text-lg font-semibold tabular-nums">
                    {formatMoney(minimumBidCents)}+
                  </span>
                ) : null
              }
            />
            <PanelBody>
              <BidSubmissionForm
                action={submitBidAction}
                canSubmit={!bidAvailabilityError}
                disabledReason={bidAvailabilityError}
                minimumBidCents={minimumBidCents ?? DEFAULT_MINIMUM_BID_CENTS}
                commerceLayers={COMMERCE_LAYER}
              />
            </PanelBody>
          </Panel>
          <p className="mt-3 flex items-start gap-2 text-xs text-ink-muted dark:text-canvas-muted">
            <Icon name="shield" size={14} className="mt-0.5 shrink-0 text-moss" />
            The host selects on fit, not just price. Accepted terms are recorded on the booking and
            payment is handled through BidSpace.
          </p>
        </aside>
      </div>
    </div>
  );
}
