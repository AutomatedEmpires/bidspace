import Link from "next/link";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formatMoney } from "@bidspace/core";
import {
  ServiceError,
  getApplication,
  getBid,
  getOrCreateThread,
  listApplicationsForVendorOrg,
  listBidsForBidderOrg,
  transitionApplication,
  transitionBid,
  withdrawBid,
  type BidWithContext,
  type ApplicationWithContext,
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

export const metadata: Metadata = { title: "Bids & applications" };
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

const ACTIVE_APPLICATION_STATUSES = ["submitted", "under_review", "shortlisted", "waitlisted", "approved"];

function ApplicationRowCard({
  application,
  onWithdraw,
  onMessage,
}: {
  application: ApplicationWithContext;
  onWithdraw: (formData: FormData) => Promise<void>;
  onMessage: (formData: FormData) => Promise<void>;
}) {
  const canWithdraw = ["submitted", "under_review", "shortlisted", "waitlisted"].includes(application.status);
  return (
    <Panel>
      <PanelBody className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link href={`/opportunities/${application.opportunity?.slug ?? application.opportunity_id}`} className="font-display font-semibold hover:underline">
              {application.opportunity?.title ?? "Space listing"}
            </Link>
            {application.inventory_unit ? <p className="text-sm text-ink-muted dark:text-canvas-muted">{application.inventory_unit.name}</p> : null}
          </div>
          <StatusBadge status={application.status} />
        </div>
        <p className="text-sm leading-relaxed">{application.pitch}</p>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <p className="text-xs text-ink-muted dark:text-canvas-muted">Applied {formatDateTime(application.created_at)}</p>
          {canWithdraw ? (
            <form action={onWithdraw}>
              <input type="hidden" name="applicationId" value={application.id} />
              <Button type="submit" variant="ghost" size="sm">Withdraw application</Button>
            </form>
          ) : null}
          <form action={onMessage}>
            <input type="hidden" name="applicationId" value={application.id} />
            <Button type="submit" variant="secondary" size="sm">
              <Icon name="message" size={15} /> Message host
            </Button>
          </form>
        </div>
      </PanelBody>
    </Panel>
  );
}

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
                Open legacy placement preview
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

  const [bids, applications] = await Promise.all([
    listBidsForBidderOrg(db, context.activeDbOrganizationId),
    listApplicationsForVendorOrg(db, context.activeDbOrganizationId),
  ]);
  const active = bids.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const settled = bids.filter((b) => !ACTIVE_STATUSES.includes(b.status));
  const activeApplications = applications.filter((application) => ACTIVE_APPLICATION_STATUSES.includes(application.status));
  const settledApplications = applications.filter((application) => !ACTIVE_APPLICATION_STATUSES.includes(application.status));

  async function withdrawApplicationAction(formData: FormData) {
    "use server";
    const current = await requireVendorContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const applicationId = String(formData.get("applicationId") ?? "");
    try {
      const application = await getApplication(serverDb, applicationId);
      if (application.vendor_organization_id !== current.activeDbOrganizationId) return;
      await transitionApplication(serverDb, applicationId, "withdrawn");
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    revalidatePath("/bids");
  }

  async function messageApplicationAction(formData: FormData) {
    "use server";
    const current = await requireVendorContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const applicationId = String(formData.get("applicationId") ?? "");
    const application = await getApplication(serverDb, applicationId);
    if (application.vendor_organization_id !== current.activeDbOrganizationId) return;
    const thread = await getOrCreateThread(serverDb, { context: "application", applicationId });
    redirect(`/messages/${thread.id}`);
  }

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
        kicker="Submissions"
        title="Your bids and applications"
        lede="Track every pitch to a host. Sealed bid amounts stay private; applications focus on fit and setup. Preview selections do not create payment or a binding placement."
      />

      <section>
        <h2 className="font-display text-xl font-semibold">Active applications ({activeApplications.length})</h2>
        {activeApplications.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {activeApplications.map((application) => (
              <ApplicationRowCard key={application.id} application={application} onWithdraw={withdrawApplicationAction} onMessage={messageApplicationAction} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-muted dark:text-canvas-muted">No applications are in host review.</p>
        )}
      </section>

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

      {settledApplications.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold">Application history ({settledApplications.length})</h2>
          <div className="mt-4 grid gap-3">
            {settledApplications.map((application) => (
              <ApplicationRowCard key={application.id} application={application} onWithdraw={withdrawApplicationAction} onMessage={messageApplicationAction} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
