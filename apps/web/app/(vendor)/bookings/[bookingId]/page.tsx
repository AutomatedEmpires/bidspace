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
  initiateBookingPayment,
  listReviewsForOrganization,
  splitPayment,
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
import { createBookingCheckoutSession, isStripeEnabled } from "@/lib/stripe";

export const metadata: Metadata = { title: "Booking" };
export const dynamic = "force-dynamic";

export default async function VendorBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireVendorContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const { bookingId } = await params;
  const query = await searchParams;

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
  const justPaid = query.paid === "1" && paymentPending;
  const stripeReady = isStripeEnabled() && Boolean(hostOrg?.stripe_account_id);

  const myReviews = await listReviewsForOrganization(db, booking.host_organization_id);
  const alreadyReviewed = myReviews.some(
    (r) => r.booking_id === booking.id && r.reviewer_organization_id === context.activeDbOrganizationId,
  );

  async function payNowAction() {
    "use server";
    const current = await requireVendorContext();
    const serverDb = tryGetDb();
    if (!serverDb || !isStripeEnabled()) return;
    const currentBooking = await getBooking(serverDb, bookingId);
    if (
      currentBooking.bidder_organization_id !== current.activeDbOrganizationId ||
      currentBooking.status !== "pending_payment"
    ) {
      return;
    }
    const host = (
      await serverDb.from("organizations").select("stripe_account_id, name").eq("id", currentBooking.host_organization_id).maybeSingle()
    ).data as Pick<OrganizationRow, "stripe_account_id" | "name"> | null;
    if (!host?.stripe_account_id) return;

    // Ensure a payment record exists before money moves.
    const existing = (
      await serverDb
        .from("payments")
        .select("id")
        .eq("booking_id", currentBooking.id)
        .eq("status", "pending")
        .maybeSingle()
    ).data;
    if (!existing) {
      await initiateBookingPayment(serverDb, { bookingId: currentBooking.id });
    }

    const split = splitPayment(currentBooking.price_cents);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const session = await createBookingCheckoutSession({
      bookingId: currentBooking.id,
      amountCents: split.amountCents,
      applicationFeeCents: split.platformFeeCents,
      hostStripeAccountId: host.stripe_account_id,
      productName: `BidSpace booking — ${host.name}`,
      successUrl: `${siteUrl}/bookings/${currentBooking.id}?paid=1`,
      cancelUrl: `${siteUrl}/bookings/${currentBooking.id}`,
    });
    if (session.url) redirect(session.url);
  }

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
      await submitReview(serverDb, {
        bookingId,
        reviewerOrganizationId: current.activeDbOrganizationId,
        reviewedOrganizationId: booking!.host_organization_id,
        rating: Number(formData.get("rating") ?? 0),
        writtenFeedback: String(formData.get("feedback") ?? "").trim() || undefined,
        wouldBookAgain: formData.get("rebook") === "on",
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

      {justPaid ? (
        <div className="rounded-[4px] border border-moss/40 bg-moss/[0.06] p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-moss dark:text-moss-bright">
            <Icon name="success" size={17} /> Payment received — confirming your booking.
          </p>
          <p className="mt-1 text-ink-muted dark:text-canvas-muted">
            Stripe is finalizing the transfer. This page updates automatically once the webhook
            lands (usually seconds).
          </p>
        </div>
      ) : null}

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
                  Site access, load-in instructions, and host contacts unlock after payment
                  confirms. Public pages never carry this information.
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
              <PanelHeader title="Complete payment" kicker="Confirm your position" />
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
                {stripeReady ? (
                  <form action={payNowAction}>
                    <Button type="submit" variant="signal" size="lg" className="w-full">
                      <Icon name="money" size={18} />
                      Pay {formatMoney(booking.price_cents)} securely
                    </Button>
                  </form>
                ) : (
                  <div className="rounded-[3px] border border-line bg-canvas p-3 text-sm text-ink-muted dark:bg-ink dark:text-canvas-muted">
                    {isStripeEnabled()
                      ? "The host has not finished connecting their payout account yet. You will be able to pay as soon as they do."
                      : "Payments are not enabled in this environment (Stripe keys not configured)."}
                  </div>
                )}
                <p className="text-xs text-ink-muted dark:text-canvas-muted">
                  Paying through BidSpace records the accepted terms, holds the position, and
                  covers you under the marketplace rules.
                </p>
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
