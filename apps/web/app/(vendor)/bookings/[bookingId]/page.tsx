import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formatMoney } from "@bidspace/core";
import {
  NotFoundError,
  ServiceError,
  getBooking,
  getInventoryUnit,
  getOrCreateThread,
  listReviewsForOrganization,
  submitReview,
} from "@bidspace/services";
import type { OrganizationRow, PaymentRow, VenueRow } from "@bidspace/db";
import {
  Button,
  DescriptionList,
  EmptyState,
  Field,
  Icon,
  Input,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  StatusBadge,
  Textarea,
  buttonClasses,
} from "@bidspace/ui";
import { requireVendorContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";
import { formatDateRange, formatDateTime } from "@/lib/format";
import { captureServerEvent } from "@/lib/analytics-server";

export const metadata: Metadata = { title: "Booking" };
export const dynamic = "force-dynamic";

export default async function VendorBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const context = await requireVendorContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const { bookingId } = await params;

  let booking;
  try {
    booking = await getBooking(db, bookingId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  if (booking.bidder_organization_id !== context.activeDbOrganizationId) notFound();

  const unit = await getInventoryUnit(db, booking.inventory_unit_id).catch(() => null);
  const hostOrg = booking.host_organization_id
    ? ((await db.from("organizations").select("*").eq("id", booking.host_organization_id).maybeSingle()).data as OrganizationRow | null)
    : null;
  const venue = unit?.venue_id
    ? ((await db.from("venues").select("*").eq("id", unit.venue_id).maybeSingle()).data as VenueRow | null)
    : null;
  const payment = (
    await db
      .from("payments")
      .select("*")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ).data as PaymentRow | null;

  const operational = ["confirmed", "upcoming", "in_progress"].includes(booking.status);
  const paymentPending = booking.status === "pending_payment";

  const myReviews = await listReviewsForOrganization(db, booking.host_organization_id);
  const alreadyReviewed = myReviews.some(
    (r) => r.booking_id === booking.id && r.reviewer_organization_id === context.activeDbOrganizationId,
  );

  async function messageHostAction() {
    "use server";
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const thread = await getOrCreateThread(serverDb, { context: "booking", bookingId });
    redirect(`/messages/${thread.id}`);
  }

  async function submitReviewAction(formData: FormData) {
    "use server";
    const current = await requireVendorContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    try {
      const review = await submitReview(serverDb, {
        bookingId,
        reviewerOrganizationId: current.activeDbOrganizationId,
        reviewedOrganizationId: booking!.host_organization_id,
        rating: Number(formData.get("rating") ?? 0),
        writtenFeedback: String(formData.get("feedback") ?? "").trim() || undefined,
        wouldBookAgain: formData.get("rebook") === "on",
      });
      captureServerEvent("review_submitted", current.activeDbOrganizationId, {
        booking_id: bookingId,
        review_id: review.id,
        direction: "vendor_reviews_host",
      });
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    revalidatePath(`/bookings/${bookingId}`);
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Booking"
        title={unit?.name ?? "Your booking"}
        lede={hostOrg ? `Hosted by ${hostOrg.name}` : undefined}
        actions={<StatusBadge status={booking.status} className="!text-xs" />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid content-start gap-6">
          <Panel>
            <PanelHeader title="The agreement" kicker="Recorded terms" />
            <PanelBody>
              <DescriptionList
                items={[
                  { term: "Dates", detail: formatDateRange(booking.starts_at, booking.ends_at) },
                  { term: "Price", detail: formatMoney(booking.price_cents) },
                  { term: "Position", detail: unit?.name },
                  { term: "Dimensions", detail: unit?.dimensions },
                  { term: "Setup window", detail: unit?.setup_window },
                  { term: "Teardown window", detail: unit?.teardown_window },
                  { term: "Contract terms", detail: booking.contract_terms },
                  { term: "Booked", detail: formatDateTime(booking.created_at) },
                ]}
              />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Operational access"
              kicker={operational ? "You are booked" : "Unlocks when confirmed"}
            />
            <PanelBody>
              {operational ? (
                <DescriptionList
                  items={[
                    { term: "Venue", detail: venue ? `${venue.name} — ${venue.address_line_1}, ${venue.city}, ${venue.state}` : null },
                    { term: "Access instructions", detail: venue?.access_instructions },
                    { term: "Parking", detail: venue?.parking_info },
                    { term: "Restrooms", detail: venue?.restroom_info },
                    { term: "Host notes", detail: booking.host_notes },
                  ]}
                />
              ) : (
                <p className="text-sm text-ink-muted dark:text-canvas-muted">
                  Site access, load-in instructions, and host contacts remain hidden until the
                  founder approves a live placement workflow. Public pages never carry this information.
                </p>
              )}
            </PanelBody>
          </Panel>

          {booking.status === "completed" && !alreadyReviewed ? (
            <Panel>
              <PanelHeader title="Review this host" kicker="Grounded in this booking" />
              <PanelBody>
                <form action={submitReviewAction} className="grid gap-4">
                  <Field label="Overall rating (1–5)" htmlFor="rating" required>
                    <Input id="rating" name="rating" type="number" min={1} max={5} step={1} required className="max-w-[120px]" />
                  </Field>
                  <Field label="What should other vendors know?" htmlFor="feedback">
                    <Textarea id="feedback" name="feedback" rows={3} />
                  </Field>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="rebook" className="size-4 accent-signal" />
                    I would book with this host again
                  </label>
                  <Button type="submit" variant="primary" size="md" className="justify-self-start">
                    Submit review
                  </Button>
                </form>
              </PanelBody>
            </Panel>
          ) : null}
        </div>

        <aside className="grid content-start gap-4">
          {paymentPending ? (
            <Panel>
              <PanelHeader title="Payment disabled" kicker="Founder preview" />
              <PanelBody className="grid gap-3">
                {payment ? (
                  <DescriptionList
                    columns={1}
                    items={[
                      { term: "Total", detail: formatMoney(payment.amount_cents) },
                      {
                        term: "Platform fee (paid by host)",
                        detail: payment.platform_fee_cents != null ? formatMoney(payment.platform_fee_cents) : null,
                      },
                    ]}
                  />
                ) : (
                  <p className="text-sm tabular-nums">Total: {formatMoney(booking.price_cents)}</p>
                )}
                <div className="rounded-[3px] border border-plan/30 bg-plan/[0.06] p-3 text-sm text-plan-deep dark:text-plan-bright">
                  No checkout or payment commitment is available. This record is retained only as
                  a test fixture for the future placement workflow.
                </div>
                <p className="text-xs text-ink-muted dark:text-canvas-muted">
                  Fee policy, legal terms, refunds, and payment operations require founder approval before launch.
                </p>
              </PanelBody>
            </Panel>
          ) : null}

          {!paymentPending && payment ? (
            <Panel>
              <PanelHeader
                title="Payment"
                kicker="Your record"
                actions={<StatusBadge status={payment.status} />}
              />
              <PanelBody className="grid gap-3">
                <DescriptionList
                  columns={1}
                  items={[
                    { term: "Amount", detail: formatMoney(payment.amount_cents) },
                    {
                      term: "Platform fee (paid by host)",
                      detail:
                        payment.platform_fee_cents != null
                          ? formatMoney(payment.platform_fee_cents)
                          : null,
                    },
                    {
                      term: "Refunded",
                      detail: payment.refund_cents ? formatMoney(payment.refund_cents) : null,
                    },
                  ]}
                />
                {payment.receipt_url ? (
                  <a
                    href={payment.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClasses("secondary", "sm", "w-full")}
                  >
                    <Icon name="external" size={15} />
                    View Stripe receipt
                  </a>
                ) : null}
              </PanelBody>
            </Panel>
          ) : null}

          <Panel>
            <PanelBody className="grid gap-2">
              <form action={messageHostAction}>
                <Button type="submit" variant="secondary" size="md" className="w-full">
                  <Icon name="message" size={17} />
                  Message the host
                </Button>
              </form>
              <Link href="/bookings" className={buttonClasses("ghost", "sm", "w-full")}>
                Back to bookings
              </Link>
            </PanelBody>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
