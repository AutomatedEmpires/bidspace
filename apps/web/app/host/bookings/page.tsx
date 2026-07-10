import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { formatMoney } from "@bidspace/core";
import {
  ServiceError,
  getBooking,
  listBookingsForOrg,
  submitReview,
  transitionBooking,
} from "@bidspace/services";
import type { ReviewRow } from "@bidspace/db";
import {
  Button,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  StatusBadge,
  Table,
  TBody,
  TD,
  TH,
  THead,
  Textarea,
} from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";
import { formatDateRange } from "@/lib/format";
import { captureServerEvent } from "@/lib/analytics-server";
import { ConfirmSubmit } from "@/components/confirm-submit";

export const metadata: Metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

const HOST_TRANSITIONS: Record<string, { to: string; label: string }[]> = {
  confirmed: [{ to: "upcoming", label: "Mark upcoming" }],
  upcoming: [{ to: "in_progress", label: "Check in" }],
  in_progress: [{ to: "completed", label: "Complete" }],
};

export default async function HostBookingsPage() {
  const context = await requireHostContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const bookings = await listBookingsForOrg(db, context.activeDbOrganizationId, "host");

  // Completed bookings this host has not yet reviewed — reviews compound the
  // vendor's marketplace record and power next season's invitations.
  const completed = bookings.filter((b) => ["completed", "reviewed"].includes(b.status));
  const myReviews = completed.length
    ? (((
        await db
          .from("reviews")
          .select("booking_id, reviewer_organization_id")
          .in("booking_id", completed.map((b) => b.id))
      ).data ?? []) as Pick<ReviewRow, "booking_id" | "reviewer_organization_id">[])
    : [];
  const awaitingReview = completed.filter(
    (b) =>
      !myReviews.some(
        (r) => r.booking_id === b.id && r.reviewer_organization_id === context.activeDbOrganizationId,
      ),
  );

  async function reviewVendorAction(formData: FormData) {
    "use server";
    const current = await requireHostContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const bookingId = String(formData.get("bookingId") ?? "");
    try {
      const booking = await getBooking(serverDb, bookingId);
      if (booking.host_organization_id !== current.activeDbOrganizationId) return;
      const review = await submitReview(serverDb, {
        bookingId,
        reviewerOrganizationId: current.activeDbOrganizationId,
        reviewedOrganizationId: booking.bidder_organization_id,
        rating: Number(formData.get("rating") ?? 0),
        professionalismRating: formData.get("professionalism")
          ? Number(formData.get("professionalism"))
          : undefined,
        writtenFeedback: String(formData.get("feedback") ?? "").trim() || undefined,
        wouldBookAgain: formData.get("rebook") === "on",
      });
      captureServerEvent("review_submitted", current.activeDbOrganizationId, {
        booking_id: bookingId,
        review_id: review.id,
        direction: "host_reviews_vendor",
      });
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    revalidatePath("/host/bookings");
  }

  async function transitionAction(formData: FormData) {
    "use server";
    const current = await requireHostContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const bookingId = String(formData.get("bookingId") ?? "");
    const to = String(formData.get("to") ?? "");
    try {
      const booking = await getBooking(serverDb, bookingId);
      if (booking.host_organization_id !== current.activeDbOrganizationId) return;
      const legal = (HOST_TRANSITIONS[booking.status] ?? []).some((t) => t.to === to) || to === "cancelled";
      if (!legal) return;
      await transitionBooking(serverDb, bookingId, to as never);
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    revalidatePath("/host/bookings");
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Bookings"
        title="Confirmed commitments"
        lede="Each booking preserves the accepted terms. Move them through the day-of lifecycle as it happens."
      />

      {bookings.length > 0 ? (
        <Table>
          <THead>
            <tr>
              <TH>Vendor</TH>
              <TH>Position</TH>
              <TH>Dates</TH>
              <TH className="text-right">Price</TH>
              <TH>Status</TH>
              <TH />
            </tr>
          </THead>
          <TBody>
            {bookings.map((booking) => {
              const actions = HOST_TRANSITIONS[booking.status] ?? [];
              return (
                <tr key={booking.id}>
                  <TD className="font-medium">{booking.bidder_organization?.name ?? "Vendor"}</TD>
                  <TD>{booking.inventory_unit?.name ?? "—"}</TD>
                  <TD>{formatDateRange(booking.starts_at, booking.ends_at)}</TD>
                  <TD className="text-right font-semibold tabular-nums">{formatMoney(booking.price_cents)}</TD>
                  <TD>
                    <StatusBadge status={booking.status} />
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-1.5">
                      {actions.map((action) => (
                        <form key={action.to} action={transitionAction}>
                          <input type="hidden" name="bookingId" value={booking.id} />
                          <input type="hidden" name="to" value={action.to} />
                          <Button type="submit" variant="secondary" size="sm">
                            {action.label}
                          </Button>
                        </form>
                      ))}
                      {["pending_payment", "confirmed", "upcoming"].includes(booking.status) ? (
                        <form action={transitionAction}>
                          <input type="hidden" name="bookingId" value={booking.id} />
                          <input type="hidden" name="to" value="cancelled" />
                          <ConfirmSubmit
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="!text-alert"
                            confirm="Cancel this booking? The vendor is notified and this cannot be undone."
                          >
                            Cancel
                          </ConfirmSubmit>
                        </form>
                      ) : null}
                    </div>
                  </TD>
                </tr>
              );
            })}
          </TBody>
        </Table>
      ) : (
        <EmptyState
          icon="booking"
          title="No bookings yet"
          body="Award a bid and the booking appears here the moment payment is requested."
        />
      )}

      {awaitingReview.length > 0 ? (
        <Panel>
          <PanelHeader
            title={`Review your vendors (${awaitingReview.length})`}
            kicker="Grounded in completed bookings — this builds the network you invite next season"
          />
          <PanelBody className="grid gap-5">
            {awaitingReview.map((booking) => (
              <form
                key={booking.id}
                action={reviewVendorAction}
                className="grid gap-3 rounded-[3px] border border-line p-4"
              >
                <input type="hidden" name="bookingId" value={booking.id} />
                <p className="font-display font-semibold">
                  {booking.bidder_organization?.name ?? "Vendor"}
                  <span className="ml-2 text-sm font-normal text-ink-muted dark:text-canvas-muted">
                    {booking.inventory_unit?.name ?? "position"} · {formatDateRange(booking.starts_at, booking.ends_at)}
                  </span>
                </p>
                <div className="grid gap-3 sm:grid-cols-[140px_170px_1fr_auto]">
                  <Field label="Overall (1–5)" htmlFor={`rating-${booking.id}`} required>
                    <Input id={`rating-${booking.id}`} name="rating" type="number" min={1} max={5} step={1} required />
                  </Field>
                  <Field label="Professionalism (1–5)" htmlFor={`prof-${booking.id}`}>
                    <Input id={`prof-${booking.id}`} name="professionalism" type="number" min={1} max={5} step={1} />
                  </Field>
                  <Field label="Notes for future hosts" htmlFor={`feedback-${booking.id}`}>
                    <Textarea id={`feedback-${booking.id}`} name="feedback" rows={1} />
                  </Field>
                  <div className="grid content-end gap-2 pb-1">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="rebook" className="size-4 accent-signal" />
                      Would book again
                    </label>
                    <Button type="submit" variant="primary" size="sm">
                      Submit review
                    </Button>
                  </div>
                </div>
              </form>
            ))}
          </PanelBody>
        </Panel>
      ) : null}
    </div>
  );
}
