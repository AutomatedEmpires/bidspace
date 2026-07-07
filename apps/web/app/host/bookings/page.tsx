import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { formatMoney } from "@bidspace/core";
import {
  ServiceError,
  getBooking,
  listBookingsForOrg,
  transitionBooking,
} from "@bidspace/services";
import {
  Button,
  EmptyState,
  PageHeader,
  StatusBadge,
  Table,
  TBody,
  TD,
  TH,
  THead,
} from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";
import { formatDateRange } from "@/lib/format";

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
                          <Button type="submit" variant="ghost" size="sm" className="!text-alert">
                            Cancel
                          </Button>
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
    </div>
  );
}
