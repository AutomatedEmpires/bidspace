import Link from "next/link";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { formatMoney, toCents } from "@bidspace/core";
import {
  HOST_DECISION_STATUSES,
  ServiceError,
  TransitionError,
  acceptBid,
  counterBid,
  createBookingForBid,
  getBid,
  initiateBookingPayment,
  listBidsForHostOrg,
  rejectBid,
  requestBidPayment,
  shortlistBid,
  transitionInventoryUnit,
  viewBid,
  waitlistBid,
  type BidWithContext,
} from "@bidspace/services";
import {
  Badge,
  Button,
  EmptyState,
  Icon,
  Input,
  PageHeader,
  Panel,
  PanelBody,
  StatusBadge,
} from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Bid review" };
export const dynamic = "force-dynamic";

async function requireOwnedBid(bidId: string) {
  const current = await requireHostContext();
  const db = tryGetDb();
  if (!db) return null;
  const bid = await getBid(db, bidId);
  if (bid.host_organization_id !== current.activeDbOrganizationId) return null;
  return { db, bid, current };
}

export default async function HostBidReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireHostContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const params = await searchParams;
  const opportunityFilter = typeof params.opportunity === "string" ? params.opportunity : null;
  const errorMessage = typeof params.error === "string" ? decodeURIComponent(params.error) : null;

  let bids = await listBidsForHostOrg(db, context.activeDbOrganizationId);
  if (opportunityFilter) bids = bids.filter((b) => b.opportunity_id === opportunityFilter);

  const needsDecision = bids.filter((b) => HOST_DECISION_STATUSES.includes(b.status));
  const inMotion = bids.filter((b) => ["accepted", "payment_pending", "paid"].includes(b.status));
  const settled = bids.filter(
    (b) => !HOST_DECISION_STATUSES.includes(b.status) && !["accepted", "payment_pending", "paid"].includes(b.status),
  );

  async function pipelineAction(formData: FormData) {
    "use server";
    const bidId = String(formData.get("bidId") ?? "");
    const action = String(formData.get("action") ?? "");
    const owned = await requireOwnedBid(bidId);
    if (!owned) return;
    const { db: serverDb, bid } = owned;

    try {
      switch (action) {
        case "view":
          await viewBid(serverDb, bidId);
          break;
        case "shortlist":
          if (bid.status === "submitted") await viewBid(serverDb, bidId);
          await shortlistBid(serverDb, bidId);
          break;
        case "waitlist":
          if (bid.status === "submitted") await viewBid(serverDb, bidId);
          await waitlistBid(serverDb, bidId);
          break;
        case "reject":
          if (bid.status === "submitted") await viewBid(serverDb, bidId);
          await rejectBid(serverDb, bidId);
          break;
        case "counter": {
          const dollars = String(formData.get("counterDollars") ?? "").trim();
          if (!dollars) return;
          if (bid.status === "submitted") await viewBid(serverDb, bidId);
          await counterBid(serverDb, bidId, toCents(Number(dollars)));
          break;
        }
        case "award": {
          // The full award chain: accept -> request payment -> booking ->
          // payment record. Terms are snapshotted on the booking.
          if (bid.status === "submitted") await viewBid(serverDb, bidId);
          if (["viewed", "shortlisted", "countered", "waitlisted"].includes(
            (await getBid(serverDb, bidId)).status,
          )) {
            await acceptBid(serverDb, bidId);
          }
          await requestBidPayment(serverDb, bidId);
          const booking = await createBookingForBid(serverDb, bidId);
          await initiateBookingPayment(serverDb, { bookingId: booking.id });
          if (bid.inventory_unit_id) {
            try {
              await transitionInventoryUnit(serverDb, bid.inventory_unit_id, "reserved");
              await transitionInventoryUnit(serverDb, bid.inventory_unit_id, "payment_pending");
            } catch (error) {
              if (!(error instanceof TransitionError)) throw error;
            }
          }
          break;
        }
        default:
          return;
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        const { redirect } = await import("next/navigation");
        redirect(`/host/bids?error=${encodeURIComponent(error.message)}`);
      }
      throw error;
    }
    revalidatePath("/host/bids");
    revalidatePath("/host/bookings");
  }

  function BidReviewCard({ bid }: { bid: BidWithContext }) {
    const decidable = HOST_DECISION_STATUSES.includes(bid.status);
    return (
      <Panel>
        <PanelBody className="grid gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-lg font-semibold">
                  {bid.bidder_organization?.name ?? "Vendor"}
                </p>
                {bid.bidder_organization?.verification_status === "verified" ? (
                  <Badge tone="positive">
                    <Icon name="verified" size={11} weight="fill" /> Verified
                  </Badge>
                ) : null}
                <StatusBadge status={bid.status} />
              </div>
              <p className="mt-0.5 text-sm text-ink-muted dark:text-canvas-muted">
                {bid.opportunity?.title ?? "Opportunity"}
                {bid.inventory_unit ? ` · ${bid.inventory_unit.name}` : ""} ·{" "}
                {formatDateTime(bid.created_at)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-semibold tabular-nums">
                {formatMoney(bid.amount_cents)}
              </p>
              {bid.counter_amount_cents != null ? (
                <p className="text-xs text-signal-deep dark:text-signal-bright">
                  countered at {formatMoney(bid.counter_amount_cents)}
                </p>
              ) : null}
            </div>
          </div>

          {bid.intended_use ? (
            <p className="rounded-[3px] border border-line bg-canvas px-3 py-2 text-sm leading-relaxed dark:bg-ink">
              {bid.intended_use}
            </p>
          ) : null}

          {decidable ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <form action={pipelineAction}>
                <input type="hidden" name="bidId" value={bid.id} />
                <input type="hidden" name="action" value="award" />
                <Button type="submit" variant="signal" size="sm">
                  <Icon name="check" size={15} />
                  Award & request payment
                </Button>
              </form>
              {bid.status !== "shortlisted" ? (
                <form action={pipelineAction}>
                  <input type="hidden" name="bidId" value={bid.id} />
                  <input type="hidden" name="action" value="shortlist" />
                  <Button type="submit" variant="secondary" size="sm">
                    Shortlist
                  </Button>
                </form>
              ) : null}
              <form action={pipelineAction} className="flex items-center gap-1.5">
                <input type="hidden" name="bidId" value={bid.id} />
                <input type="hidden" name="action" value="counter" />
                <Input
                  name="counterDollars"
                  type="number"
                  min={0.01}
                  step="0.01"
                  placeholder="Counter $"
                  className="h-8 w-28 text-[13px]"
                  aria-label="Counter amount in dollars"
                />
                <Button type="submit" variant="secondary" size="sm">
                  Counter
                </Button>
              </form>
              <form action={pipelineAction}>
                <input type="hidden" name="bidId" value={bid.id} />
                <input type="hidden" name="action" value="waitlist" />
                <Button type="submit" variant="ghost" size="sm">
                  Waitlist
                </Button>
              </form>
              <form action={pipelineAction}>
                <input type="hidden" name="bidId" value={bid.id} />
                <input type="hidden" name="action" value="reject" />
                <Button type="submit" variant="ghost" size="sm" className="!text-alert">
                  Decline
                </Button>
              </form>
            </div>
          ) : null}
        </PanelBody>
      </Panel>
    );
  }

  return (
    <div className="grid gap-10">
      <PageHeader
        kicker="Bid review"
        title="Who gets the space?"
        lede="Sealed offers with the business behind them. Awarding snapshots the terms and opens payment — the highest number does not auto-win."
        actions={
          opportunityFilter ? (
            <Link href="/host/bids" className="text-sm font-semibold text-signal-deep hover:underline dark:text-signal-bright">
              Clear filter
            </Link>
          ) : undefined
        }
      />

      {errorMessage ? (
        <p role="alert" className="rounded-[3px] border border-alert/40 bg-alert/[0.06] px-4 py-3 text-sm font-medium text-alert">
          {errorMessage}
        </p>
      ) : null}

      <section>
        <h2 className="font-display text-xl font-semibold">Needs your decision ({needsDecision.length})</h2>
        {needsDecision.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {needsDecision.map((bid) => (
              <BidReviewCard key={bid.id} bid={bid} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            icon="bid"
            title="No submissions waiting"
            body="Invite vendors you already know or widen visibility — supply attracts offers."
            actions={
              <Link href="/host/network" className="text-sm font-semibold text-signal-deep hover:underline dark:text-signal-bright">
                Build your vendor network
              </Link>
            }
          />
        )}
      </section>

      {inMotion.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold">Awarded — money in motion ({inMotion.length})</h2>
          <div className="mt-4 grid gap-3">
            {inMotion.map((bid) => (
              <BidReviewCard key={bid.id} bid={bid} />
            ))}
          </div>
        </section>
      ) : null}

      {settled.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold">History ({settled.length})</h2>
          <div className="mt-4 grid gap-3">
            {settled.slice(0, 20).map((bid) => (
              <BidReviewCard key={bid.id} bid={bid} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
