import Link from "next/link";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formatMoney, toCents, type ApplicationStatus } from "@bidspace/core";
import {
  APPLICATION_REVIEW_STATUSES,
  HOST_DECISION_STATUSES,
  ServiceError,
  acceptBid,
  counterBid,
  getApplication,
  getBid,
  getOrCreateThread,
  listApplicationsForHostOrg,
  listBidsForHostOrg,
  rejectBid,
  shortlistBid,
  transitionApplication,
  viewBid,
  waitlistBid,
  type ApplicationWithContext,
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
import { captureServerEvent } from "@/lib/analytics-server";
import { ConfirmSubmit } from "@/components/confirm-submit";

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

async function requireOwnedApplication(applicationId: string) {
  const current = await requireHostContext();
  const db = tryGetDb();
  if (!db) return null;
  const application = await getApplication(db, applicationId);
  if (application.host_organization_id !== current.activeDbOrganizationId) return null;
  return { db, application, current };
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
  let applications = await listApplicationsForHostOrg(db, context.activeDbOrganizationId);
  if (opportunityFilter) bids = bids.filter((b) => b.opportunity_id === opportunityFilter);
  if (opportunityFilter) {
    applications = applications.filter((application) => application.opportunity_id === opportunityFilter);
  }

  const needsDecision = bids.filter((b) => HOST_DECISION_STATUSES.includes(b.status));
  const inMotion = bids.filter((b) => b.status === "accepted");
  const settled = bids.filter(
    (b) => !HOST_DECISION_STATUSES.includes(b.status) && b.status !== "accepted",
  );
  const applicationsNeedingDecision = applications.filter((application) =>
    APPLICATION_REVIEW_STATUSES.includes(application.status),
  );
  const applicationsDecided = applications.filter(
    (application) => !APPLICATION_REVIEW_STATUSES.includes(application.status),
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
          // Founder preview: record host selection only. No booking, payment,
          // unit reservation, or binding placement is created.
          if (bid.status === "submitted") await viewBid(serverDb, bidId);
          if (["viewed", "shortlisted", "countered", "waitlisted"].includes(
            (await getBid(serverDb, bidId)).status,
          )) {
            await acceptBid(serverDb, bidId);
          }
          captureServerEvent("bid_selected_preview", owned.current.activeDbOrganizationId, {
            bid_id: bidId,
            price_cents: bid.amount_cents,
          });
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
  }

  async function applicationAction(formData: FormData) {
    "use server";
    const applicationId = String(formData.get("applicationId") ?? "");
    const to = String(formData.get("to") ?? "") as ApplicationStatus;
    const owned = await requireOwnedApplication(applicationId);
    if (!owned) return;
    try {
      await transitionApplication(owned.db, applicationId, to);
      captureServerEvent("application_reviewed", owned.current.activeDbOrganizationId, {
        application_id: applicationId,
        decision: to,
      });
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    revalidatePath("/host/bids");
  }

  async function messageApplicationAction(formData: FormData) {
    "use server";
    const applicationId = String(formData.get("applicationId") ?? "");
    const owned = await requireOwnedApplication(applicationId);
    if (!owned) return;
    const thread = await getOrCreateThread(owned.db, {
      context: "application",
      applicationId,
    });
    redirect(`/messages/${thread.id}`);
  }

  function ApplicationReviewCard({ application }: { application: ApplicationWithContext }) {
    const decidable = APPLICATION_REVIEW_STATUSES.includes(application.status);
    const actions: { to: ApplicationStatus; label: string; variant: "signal" | "secondary" | "ghost" }[] = [
      { to: "approved", label: "Approve for planning", variant: "signal" },
      { to: "shortlisted", label: "Shortlist", variant: "secondary" },
      { to: "waitlisted", label: "Waitlist", variant: "ghost" },
      { to: "declined", label: "Decline", variant: "ghost" },
    ];
    return (
      <Panel>
        <PanelBody className="grid gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold">
                {application.vendor_organization?.name ?? "Vendor"}
              </p>
              <p className="text-sm text-ink-muted dark:text-canvas-muted">
                {application.opportunity?.title ?? "Space listing"}
                {application.inventory_unit ? ` · ${application.inventory_unit.name}` : ""} · {formatDateTime(application.created_at)}
              </p>
            </div>
            <StatusBadge status={application.status} />
          </div>
          <p className="rounded-[3px] border border-line bg-canvas px-3 py-2 text-sm leading-relaxed dark:bg-ink">
            {application.pitch}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted dark:text-canvas-muted">
            {application.setup_description ? <span>Setup: {application.setup_description}</span> : null}
            {application.space_needs ? <span>Space: {application.space_needs}</span> : null}
            {application.power_needs ? <span>Needs power</span> : null}
            {application.water_needs ? <span>Needs water</span> : null}
          </div>
          {decidable ? (
            <div className="flex flex-wrap gap-2 border-t border-line pt-3">
              {actions
                .filter((action) => action.to !== application.status)
                .map((action) => (
                  <form action={applicationAction} key={action.to}>
                    <input type="hidden" name="applicationId" value={application.id} />
                    <input type="hidden" name="to" value={action.to} />
                    <Button
                      type="submit"
                      variant={action.variant}
                      size="sm"
                      className={action.to === "declined" ? "!text-alert" : undefined}
                    >
                      {action.label}
                    </Button>
                  </form>
                ))}
            </div>
          ) : null}
          <form action={messageApplicationAction} className={decidable ? undefined : "border-t border-line pt-3"}>
            <input type="hidden" name="applicationId" value={application.id} />
            <Button type="submit" variant="secondary" size="sm">
              <Icon name="message" size={15} /> Message vendor
            </Button>
          </form>
        </PanelBody>
      </Panel>
    );
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
                  Select for placement planning
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
                <ConfirmSubmit
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="!text-alert"
                  confirm="Decline this bid? The vendor is notified and cannot be re-selected for it."
                >
                  Decline
                </ConfirmSubmit>
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
        kicker="Placement review"
        title="Compare bids and applications"
        lede="Review the business, fit, requirements, pitch, and offer. The highest bid never auto-wins, and preview decisions do not create a payment or binding placement."
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
        <h2 className="font-display text-xl font-semibold">
          Applications needing review ({applicationsNeedingDecision.length})
        </h2>
        {applicationsNeedingDecision.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {applicationsNeedingDecision.map((application) => (
              <ApplicationReviewCard key={application.id} application={application} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            icon="vendor"
            title="No applications waiting"
            body="Application-mode spaces appear here when vendors submit their pitch and setup needs."
            actions={
              <Link href="/host/vendors" className="text-sm font-semibold text-signal-deep hover:underline dark:text-signal-bright">
                Discover vendors to invite
              </Link>
            }
          />
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Bids needing review ({needsDecision.length})</h2>
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
          <h2 className="font-display text-xl font-semibold">Selected for placement planning ({inMotion.length})</h2>
          <div className="mt-4 grid gap-3">
            {inMotion.map((bid) => (
              <BidReviewCard key={bid.id} bid={bid} />
            ))}
          </div>
        </section>
      ) : null}

      {applicationsDecided.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold">Application decisions ({applicationsDecided.length})</h2>
          <div className="mt-4 grid gap-3">
            {applicationsDecided.slice(0, 20).map((application) => (
              <ApplicationReviewCard key={application.id} application={application} />
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
