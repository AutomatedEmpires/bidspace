import type { Metadata } from "next";
import { formatMoney } from "@bidspace/core";
import type { PaymentRow } from "@bidspace/db";
import { EmptyState, PageHeader, StatusBadge, Table, TBody, TD, TH, THead } from "@bidspace/ui";
import { requireAdminUser } from "@/lib/admin-gate";
import { tryGetDb } from "@/lib/safe-db";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Payment exceptions" };
export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireAdminUser();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const exceptions = ((
    await db
      .from("payments")
      .select("*")
      .in("status", ["failed", "disputed", "refunded", "partially_refunded"])
      .order("updated_at", { ascending: false })
      .limit(100)
  ).data ?? []) as PaymentRow[];

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Payments"
        title="Exceptions"
        lede="Failed, disputed, and refunded movements. Money actions themselves happen in Stripe; this queue keeps the marketplace record honest."
      />
      {exceptions.length > 0 ? (
        <Table>
          <THead>
            <tr>
              <TH>Payment</TH>
              <TH>Booking</TH>
              <TH className="text-right">Amount</TH>
              <TH>Status</TH>
              <TH>Reason</TH>
              <TH>Updated</TH>
            </tr>
          </THead>
          <TBody>
            {exceptions.map((payment) => (
              <tr key={payment.id}>
                <TD className="font-mono text-xs">{payment.stripe_payment_intent_id ?? payment.id.slice(0, 8)}</TD>
                <TD className="font-mono text-xs">{payment.booking_id.slice(0, 8)}</TD>
                <TD className="text-right font-semibold tabular-nums">{formatMoney(payment.amount_cents)}</TD>
                <TD>
                  <StatusBadge status={payment.status} />
                </TD>
                <TD className="text-sm text-ink-muted dark:text-canvas-muted">{payment.failure_reason ?? "—"}</TD>
                <TD className="text-sm">{formatDateTime(payment.updated_at)}</TD>
              </tr>
            ))}
          </TBody>
        </Table>
      ) : (
        <EmptyState icon="money" title="No payment exceptions" body="Failed and disputed movements will queue here for follow-up." />
      )}
    </div>
  );
}
