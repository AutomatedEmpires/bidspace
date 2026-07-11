import Link from "next/link";
import type { Metadata } from "next";
import { formatMoney } from "@bidspace/core";
import {
  HOST_DECISION_STATUSES,
  listBidsForHostOrg,
  listBookingsForOrg,
  listEventsForOrg,
  listOpportunitiesForOrg,
  listVenuesForOrg,
} from "@bidspace/services";
import type { OrganizationRow } from "@bidspace/db";
import {
  EmptyState,
  Icon,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  StatTile,
  StatusBadge,
  buttonClasses,
} from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";
import { describeDeadline, formatDateRange } from "@/lib/format";
import { isStripeEnabled } from "@/lib/stripe";

export const metadata: Metadata = { title: "Command center" };
export const dynamic = "force-dynamic";

export default async function HostCommandCenter() {
  const context = await requireHostContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const orgId = context.activeDbOrganizationId;
  const [bids, bookings, opportunities, venues, events, orgResult] = await Promise.all([
    listBidsForHostOrg(db, orgId),
    listBookingsForOrg(db, orgId, "host"),
    listOpportunitiesForOrg(db, orgId),
    listVenuesForOrg(db, orgId),
    listEventsForOrg(db, orgId),
    db.from("organizations").select("*").eq("id", orgId).maybeSingle(),
  ]);
  const organization = orgResult.data as OrganizationRow | null;

  const pendingBids = bids.filter((b) => HOST_DECISION_STATUSES.includes(b.status));
  const awaitingPayment = bookings.filter((b) => b.status === "pending_payment");
  const now = new Date();
  const closingSoon = opportunities.filter((o) => {
    if (!o.bid_deadline || !["published", "receiving_bids"].includes(o.status)) return false;
    const ms = new Date(o.bid_deadline).getTime() - now.getTime();
    return ms > 0 && ms < 5 * 86_400_000;
  });
  const upcomingEvents = events
    .filter((e) => new Date(e.ends_at) > now && e.status !== "cancelled")
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 4);
  const liveOpportunities = opportunities.filter((o) =>
    ["published", "receiving_bids"].includes(o.status),
  );
  const drafts = opportunities.filter((o) => o.status === "draft");
  const payoutsMissing = isStripeEnabled() && !organization?.stripe_account_id;

  const isNewHost = venues.length === 0 && opportunities.length === 0;
  if (isNewHost) {
    return (
      <div className="grid gap-8">
        <PageHeader
          kicker="Command center"
          title={`Welcome, ${context.activeOrganizationName ?? "host"}`}
          lede="Three steps stand between you and your first published opportunity."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Add your first location",
              body: "The fairground, market, lot, or venue you control.",
              href: "/host/venues/new",
              cta: "Add location",
            },
            {
              step: "2",
              title: "Define what can be booked",
              body: "Booths, pads, kiosks, placements — your inventory units persist across every release.",
              href: "/host/opportunities/new",
              cta: "Create opportunity",
            },
            {
              step: "3",
              title: "Publish or invite",
              body: "Open it to the public marketplace, your private network, or specific vendors.",
              href: "/host/network",
              cta: "Build your network",
            },
          ].map((card) => (
            <Panel key={card.step}>
              <PanelBody className="flex h-full flex-col gap-3">
                <span className="font-display text-3xl font-semibold text-signal">{card.step}</span>
                <h2 className="font-display text-lg font-semibold">{card.title}</h2>
                <p className="flex-1 text-sm text-ink-muted dark:text-canvas-muted">{card.body}</p>
                <Link href={card.href} className={buttonClasses(card.step === "1" ? "signal" : "secondary", "sm")}>
                  {card.cta}
                </Link>
              </PanelBody>
            </Panel>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-10">
      <PageHeader
        kicker="Command center"
        title="What needs your attention"
        actions={
          <Link href="/host/opportunities/new" className={buttonClasses("signal", "md")}>
            <Icon name="add" size={17} />
            New opportunity
          </Link>
        }
      />

      {/* NEEDS ACTION */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/host/bids">
            <StatTile
              label="Bids awaiting decision"
              value={pendingBids.length}
              icon="bid"
              tone={pendingBids.length > 0 ? "attention" : "default"}
              hint={pendingBids.length > 0 ? "Review, shortlist, or award" : "All caught up"}
            />
          </Link>
          <Link href="/host/bookings">
            <StatTile
              label="Bookings awaiting payment"
              value={awaitingPayment.length}
              icon="money"
              tone={awaitingPayment.length > 0 ? "attention" : "default"}
              hint={awaitingPayment.length > 0 ? "Vendors have been asked to pay" : "No money in flight"}
            />
          </Link>
          <Link href="/host/opportunities">
            <StatTile
              label="Closing within 5 days"
              value={closingSoon.length}
              icon="clock"
              tone={closingSoon.length > 0 ? "attention" : "default"}
              hint={closingSoon.length > 0 ? "Decide before the window shuts" : "No deadlines pressing"}
            />
          </Link>
          <Link href="/host/settings">
            <StatTile
              label="Payouts"
              value={payoutsMissing ? "Not connected" : organization?.stripe_account_id ? "Connected" : "Off"}
              icon="payout"
              tone={payoutsMissing ? "attention" : "positive"}
              hint={payoutsMissing ? "Connect Stripe to receive money" : undefined}
            />
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* UPCOMING */}
        <Panel>
          <PanelHeader
            title="Upcoming"
            kicker="Events & releases"
            actions={
              <Link href="/host/calendar" className="text-sm font-semibold text-signal-deep hover:underline dark:text-signal-bright">
                Calendar
              </Link>
            }
          />
          <PanelBody>
            {upcomingEvents.length > 0 ? (
              <ul className="grid gap-3">
                {upcomingEvents.map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{event.name}</span>
                      <span className="block text-xs text-ink-muted dark:text-canvas-muted">
                        {formatDateRange(event.starts_at, event.ends_at)}
                      </span>
                    </span>
                    <StatusBadge status={event.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted dark:text-canvas-muted">
                No upcoming events. Recurring markets and seasons live under{" "}
                <Link href="/host/events" className="font-semibold underline">
                  Events
                </Link>
                .
              </p>
            )}
          </PanelBody>
        </Panel>

        {/* SUPPLY */}
        <Panel>
          <PanelHeader
            title="Supply"
            kicker="Your marketplace inventory"
            actions={
              <Link href="/host/opportunities" className="text-sm font-semibold text-signal-deep hover:underline dark:text-signal-bright">
                Manage
              </Link>
            }
          />
          <PanelBody className="grid gap-3 text-sm">
            <p className="flex items-center justify-between">
              <span className="text-ink-muted dark:text-canvas-muted">Live opportunities</span>
              <span className="font-semibold tabular-nums">{liveOpportunities.length}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-ink-muted dark:text-canvas-muted">Drafts waiting to publish</span>
              <span className="font-semibold tabular-nums">{drafts.length}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-ink-muted dark:text-canvas-muted">Locations</span>
              <span className="font-semibold tabular-nums">{venues.length}</span>
            </p>
            {closingSoon.length > 0 ? (
              <div className="mt-1 grid gap-2 border-t border-line pt-3">
                {closingSoon.slice(0, 3).map((o) => (
                  <Link
                    key={o.id}
                    href={`/host/opportunities/${o.id}`}
                    className="flex items-center justify-between gap-2 text-sm hover:underline"
                  >
                    <span className="truncate font-medium">{o.title}</span>
                    <span className="shrink-0 text-xs font-semibold text-signal-deep dark:text-signal-bright">
                      {describeDeadline(o.bid_deadline)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </PanelBody>
        </Panel>
      </div>

      {/* LATEST BIDS */}
      {pendingBids.length > 0 ? (
        <Panel>
          <PanelHeader
            title="Waiting on your decision"
            kicker={`${pendingBids.length} bid${pendingBids.length === 1 ? "" : "s"}`}
            actions={
              <Link href="/host/bids" className={buttonClasses("primary", "sm")}>
                Open bid review
              </Link>
            }
          />
          <PanelBody>
            <ul className="grid gap-2">
              {pendingBids.slice(0, 5).map((bid) => (
                <li key={bid.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{bid.bidder_organization?.name ?? "Vendor"}</span>
                    <span className="text-ink-muted dark:text-canvas-muted">
                      {" "}
                      → {bid.opportunity?.title ?? "opportunity"}
                      {bid.inventory_unit ? ` · ${bid.inventory_unit.name}` : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="font-semibold tabular-nums">{formatMoney(bid.amount_cents)}</span>
                    <StatusBadge status={bid.status} />
                  </span>
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>
      ) : null}
    </div>
  );
}
