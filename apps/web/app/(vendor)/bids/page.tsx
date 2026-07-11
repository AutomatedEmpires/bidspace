import Link from "next/link";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { formatMoney } from "@bidspace/core";
import {
  ServiceError,
  getBid,
  listBidsForBidderOrg,
  transitionBid,
  withdrawBid,
  type BidWithContext,
} from "@bidspace/services";
import {
  Button,
  EmptyState,
  Icon,
  PageHeader,
  Panel,
  PanelBody,
  StatusBadge,
  buttonClasses,
} from "@bidspace/ui";
import { requireVendorContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Bids" };
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = [
  "submitted",
  "viewed",
  "shortlisted",
  "countered",
  "waitlisted",
  "accepted",
  "payment_pending",
];

function BidRowCard({
  bid,
  onWithdraw,
  onAcceptCounter,
}: {
  bid: BidWithContext;
  onWithdraw: (formData: FormData) => Promise<void>;
  onAcceptCounter: (formData: FormData) => Promise<void>;
}) {
  const canWithdraw = ["draft", "submitted", "viewed", "shortlisted", "countered", "waitlisted", "accepted"].includes(bid.status);
  return (
    <Panel>
      <PanelBody className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/opportunities/${bid.opportunity?.slug ?? bid.opportunity_id}`}
              className="font-display font-semibold hover:underline"
            >
              {bid.opportunity?.title ?? "Opportunity"}
            </Link>
            {bid.inventory_unit ? (
              <p className="text-sm text-ink-muted dark:text-canvas-muted">{bid.inventory_unit.name}</p>
            ) : null}
          </div>
          <StatusBadge status={bid.status} />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <p>
            <span className="text-ink-muted dark:text-canvas-muted">Your offer:</span>{" "}
            <span className="font-semibold tabular-nums">{formatMoney(bid.amount_cents)}</span>
          </p>
          {bid.counter_amount_cents != null ? (
            <p>
              <span className="text-ink-muted dark:text-canvas-muted">Host counter:</span>{" "}
              <span className="font-semibold tabular-nums text-signal-deep dark:text-signal-bright">
                {formatMoney(bid.counter_amount_cents)}
              </span>
            </p>
          ) : null}
          <p className="text-xs text-ink-muted dark:text-canvas-muted">
            Placed {formatDateTime(bid.created_at)}
          </p>
        </div>

        {bid.status === "countered" || canWithdraw ? (
          <div className="flex flex-wrap gap-2 border-t border-line pt-3">
            {bid.status === "countered" ? (
              <form action={onAcceptCounter}>
                <input type="hidden" name="bidId" value={bid.id} />
                <Button type="submit" variant="signal" size="sm">
                  <Icon name="check" size={15} />
                  Accept counter {bid.counter_amount_cents != null ? formatMoney(bid.counter_amount_cents) : ""}
                </Button>
              </form>
            ) : null}
            {canWithdraw ? (
              <form action={onWithdraw}>
                <input type="hidden" name="bidId" value={bid.id} />
                <Button type="submit" variant="ghost" size="sm">
                  Withdraw
                </Button>
              </form>
            ) : null}
            {bid.status === "payment_pending" ? (
              <Link href="/bookings" className={buttonClasses("primary", "sm")}>
                <Icon name="money" size={15} />
                Go to booking & payment
              </Link>
            ) : null}
          </div>
        ) : null}
      </PanelBody>
    </Panel>
  );
}

export default async function VendorBidsPage() {
  const context = await requireVendorContext();
  const db = tryGetDb();
  if (!db) {
    return <EmptyState icon="warning" title="Marketplace data is not connected" />;
  }

  const bids = await listBidsForBidderOrg(db, context.activeDbOrganizationId);
  const active = bids.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const settled = bids.filter((b) => !ACTIVE_STATUSES.includes(b.status));

  async function withdrawAction(formData: FormData) {
    "use server";
    const current = await requireVendorContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const bidId = String(formData.get("bidId") ?? "");
    try {
      const bid = await getBid(serverDb, bidId);
      if (bid.bidder_organization_id !== current.activeDbOrganizationId) return;
      await withdrawBid(serverDb, bidId);
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    revalidatePath("/bids");
  }

  async function acceptCounterAction(formData: FormData) {
    "use server";
    const current = await requireVendorContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const bidId = String(formData.get("bidId") ?? "");
    try {
      const bid = await getBid(serverDb, bidId);
      if (bid.bidder_organization_id !== current.activeDbOrganizationId) return;
      if (bid.status !== "countered" || bid.counter_amount_cents == null) return;
      // Accepting the host's counter locks the countered amount as the offer.
      await transitionBid(serverDb, bidId, "accepted", { amount_cents: bid.counter_amount_cents });
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    revalidatePath("/bids");
  }

  return (
    <div className="grid gap-10">
      <PageHeader
        kicker="Bids"
        title="Your offers in play"
        lede="Sealed bids: hosts see your offer and your business, competitors never do."
      />

      <section>
        <h2 className="font-display text-xl font-semibold">Active ({active.length})</h2>
        {active.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {active.map((bid) => (
              <BidRowCard key={bid.id} bid={bid} onWithdraw={withdrawAction} onAcceptCounter={acceptCounterAction} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            icon="bid"
            title="No active bids"
            body="Find a position that fits and put a real offer on it — sealed bidding means you compete on fit and value, not a public price war."
            actions={
              <Link href="/discover" className={buttonClasses("signal", "sm")}>
                Discover opportunities
              </Link>
            }
          />
        )}
      </section>

      {settled.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold">History ({settled.length})</h2>
          <div className="mt-4 grid gap-3">
            {settled.map((bid) => (
              <BidRowCard key={bid.id} bid={bid} onWithdraw={withdrawAction} onAcceptCounter={acceptCounterAction} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
