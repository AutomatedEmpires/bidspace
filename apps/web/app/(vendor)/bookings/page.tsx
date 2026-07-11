import Link from "next/link";
import type { Metadata } from "next";
import { formatMoney } from "@bidspace/core";
import { listBookingsForOrg } from "@bidspace/services";
import { EmptyState, PageHeader, StatusBadge, Table, TBody, TD, TH, THead, buttonClasses } from "@bidspace/ui";
import { requireVendorContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";
import { formatDateRange } from "@/lib/format";

export const metadata: Metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

export default async function VendorBookingsPage() {
  const context = await requireVendorContext();
  const db = tryGetDb();
  if (!db) {
    return <EmptyState icon="warning" title="Marketplace data is not connected" />;
  }

  const bookings = await listBookingsForOrg(db, context.activeDbOrganizationId, "bidder");
  const needsPayment = bookings.filter((b) => b.status === "pending_payment");

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Bookings"
        title="Your confirmed positions"
        lede="Once paid, each booking carries the accepted terms, dates, and operational details you need on the day."
      />

      {needsPayment.length > 0 ? (
        <div className="rounded-[4px] border border-signal/40 bg-signal/[0.05] p-4">
          <p className="text-sm font-semibold text-signal-deep dark:text-signal-bright">
            {needsPayment.length} booking{needsPayment.length === 1 ? "" : "s"} awaiting payment —
            positions are not held indefinitely.
          </p>
        </div>
      ) : null}

      {bookings.length > 0 ? (
        <Table>
          <THead>
            <tr>
              <TH>Position</TH>
              <TH>Host</TH>
              <TH>Dates</TH>
              <TH className="text-right">Price</TH>
              <TH>Status</TH>
              <TH />
            </tr>
          </THead>
          <TBody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <TD className="font-medium">{booking.inventory_unit?.name ?? "Position"}</TD>
                <TD className="text-ink-muted dark:text-canvas-muted">
                  {booking.host_organization?.name ?? "—"}
                </TD>
                <TD>{formatDateRange(booking.starts_at, booking.ends_at)}</TD>
                <TD className="text-right font-semibold tabular-nums">{formatMoney(booking.price_cents)}</TD>
                <TD>
                  <StatusBadge status={booking.status} />
                </TD>
                <TD className="text-right">
                  <Link
                    href={`/bookings/${booking.id}`}
                    className={buttonClasses(booking.status === "pending_payment" ? "signal" : "secondary", "sm")}
                  >
                    {booking.status === "pending_payment" ? "Pay & confirm" : "Open"}
                  </Link>
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
      ) : (
        <EmptyState
          icon="booking"
          title="No bookings yet"
          body="When a host accepts your bid and payment completes, the booking lives here with everything you need to operate."
          actions={
            <Link href="/bids" className={buttonClasses("secondary", "sm")}>
              Check your bids
            </Link>
          }
        />
      )}
    </div>
  );
}
