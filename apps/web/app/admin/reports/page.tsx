import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { recordAdminAction, transitionBooking, ServiceError } from "@bidspace/services";
import type { BookingRow, ReviewRow } from "@bidspace/db";
import { Button, EmptyState, PageHeader, Panel, PanelBody, PanelHeader, StatusBadge } from "@bidspace/ui";
import { requireAdminUser } from "@/lib/admin-gate";
import { tryGetDb } from "@/lib/safe-db";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Reports & disputes" };
export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireAdminUser();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const flaggedReviews = ((
    await db.from("reviews").select("*").eq("status", "flagged").order("created_at", { ascending: true }).limit(50)
  ).data ?? []) as ReviewRow[];
  const disputedBookings = ((
    await db.from("bookings").select("*").eq("status", "disputed").order("created_at", { ascending: true }).limit(50)
  ).data ?? []) as BookingRow[];

  async function moderateReviewAction(formData: FormData) {
    "use server";
    const admin = await requireAdminUser();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const reviewId = String(formData.get("reviewId") ?? "");
    const decision = String(formData.get("decision") ?? "");
    if (!reviewId || !["published", "hidden"].includes(decision)) return;
    await serverDb.from("reviews").update({ status: decision }).eq("id", reviewId);
    const adminUser = (
      await serverDb.from("users").select("id").eq("auth_provider_id", admin.id).maybeSingle()
    ).data as { id: string } | null;
    if (adminUser) {
      await recordAdminAction(serverDb, {
        adminUserId: adminUser.id,
        actionType: decision === "hidden" ? "hide_listing" : "flag",
        targetType: "review",
        targetId: reviewId,
        notes: `review -> ${decision}`,
      });
    }
    revalidatePath("/admin/reports");
  }

  async function resolveDisputeAction(formData: FormData) {
    "use server";
    const admin = await requireAdminUser();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const bookingId = String(formData.get("bookingId") ?? "");
    const outcome = String(formData.get("outcome") ?? "");
    if (!bookingId || !["completed", "cancelled"].includes(outcome)) return;
    try {
      await transitionBooking(serverDb, bookingId, outcome as "completed" | "cancelled");
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    const adminUser = (
      await serverDb.from("users").select("id").eq("auth_provider_id", admin.id).maybeSingle()
    ).data as { id: string } | null;
    if (adminUser) {
      await recordAdminAction(serverDb, {
        adminUserId: adminUser.id,
        actionType: "resolve_dispute",
        targetType: "booking",
        targetId: bookingId,
        notes: `dispute -> ${outcome}`,
      });
    }
    revalidatePath("/admin/reports");
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Reports & disputes"
        title="Marketplace quality"
        lede="Resolve with the booking record: recorded terms, messages, and payment state are the evidence."
      />

      <Panel>
        <PanelHeader title={`Disputed bookings (${disputedBookings.length})`} kicker="Money and reputations on hold" />
        <PanelBody>
          {disputedBookings.length > 0 ? (
            <ul className="grid gap-3">
              {disputedBookings.map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-line px-4 py-3">
                  <div>
                    <p className="font-medium">Booking {booking.id.slice(0, 8)}</p>
                    <p className="text-xs text-ink-muted dark:text-canvas-muted">
                      opened {formatDateTime(booking.created_at)}
                      {booking.cancellation_reason ? ` · reason: ${booking.cancellation_reason}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={resolveDisputeAction}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="outcome" value="completed" />
                      <Button type="submit" variant="secondary" size="sm">
                        Resolve as completed
                      </Button>
                    </form>
                    <form action={resolveDisputeAction}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="outcome" value="cancelled" />
                      <Button type="submit" variant="ghost" size="sm" className="!text-alert">
                        Cancel booking
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted dark:text-canvas-muted">No open disputes.</p>
          )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title={`Flagged reviews (${flaggedReviews.length})`} kicker="Publish or hide" />
        <PanelBody>
          {flaggedReviews.length > 0 ? (
            <ul className="grid gap-3">
              {flaggedReviews.map((review) => (
                <li key={review.id} className="grid gap-2 rounded-[3px] border border-line px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold tabular-nums">Rating {Number(review.rating)}/5</p>
                    <StatusBadge status={review.status} />
                  </div>
                  {review.written_feedback ? (
                    <p className="text-sm text-ink-soft dark:text-canvas-soft">{review.written_feedback}</p>
                  ) : null}
                  <div className="flex gap-2">
                    <form action={moderateReviewAction}>
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="decision" value="published" />
                      <Button type="submit" variant="secondary" size="sm">
                        Publish
                      </Button>
                    </form>
                    <form action={moderateReviewAction}>
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="decision" value="hidden" />
                      <Button type="submit" variant="ghost" size="sm" className="!text-alert">
                        Hide
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted dark:text-canvas-muted">No flagged reviews.</p>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
