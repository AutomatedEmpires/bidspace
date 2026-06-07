import type { BidRow, BookingRow, InventoryUnitRow, OpportunityRow, PaymentRow } from "@bidspace/db";
import type { BidStatus } from "@bidspace/core";
import {
  bidTimeline,
  describeBidStatus,
  effectiveBidCents,
  formatCents,
  humanize,
  statusAllows,
} from "@/lib/transaction-workflow";
import { hostBidAction, withdrawBidAction } from "./transaction-actions";

export function AlertMessages({
  error,
  success,
}: {
  error?: string | string[];
  success?: string | string[];
}) {
  const errorText = firstParam(error);
  const successText = firstParam(success);
  return (
    <>
      {errorText ? <div className="error-box">{errorText}</div> : null}
      {successText ? <div className="success-box">{successText}</div> : null}
    </>
  );
}

export function BidStatusBadge({ status }: { status: BidStatus }) {
  const description = describeBidStatus(status);
  const className =
    description.tone === "success"
      ? "badge badge-success"
      : description.tone === "warning"
        ? "badge badge-warning"
        : description.tone === "danger"
          ? "badge badge-danger"
          : "badge";
  return <span className={className}>{description.label}</span>;
}

export function BidTimeline({ status }: { status: BidStatus }) {
  return (
    <div className="timeline" aria-label="Bid status timeline">
      {bidTimeline(status).map((step) => (
        <span className={`timeline-step${step.current ? " is-current" : ""}`} key={step.status}>
          {step.label}
        </span>
      ))}
    </div>
  );
}

export function BookingPrepCard({
  booking,
  payment,
}: {
  booking: BookingRow | null;
  payment: PaymentRow | null;
}) {
  if (!booking) {
    return (
      <div className="notice">
        <strong>Booking prep not opened yet.</strong>
        <p className="muted">The host must accept a bid and request payment before a pending booking is created.</p>
      </div>
    );
  }

  return (
    <div className="card card-soft stack">
      <div className="card-header">
        <div>
          <p className="eyebrow">Booking prep</p>
          <h3>{humanize(booking.status)}</h3>
        </div>
        <span className="badge badge-warning">Payment pending</span>
      </div>
      <div className="stat-row">
        <div className="stat">
          <span className="muted">Booking price</span>
          <strong>{formatCents(booking.price_cents)}</strong>
        </div>
        <div className="stat">
          <span className="muted">Starts</span>
          <strong>{formatDate(booking.starts_at)}</strong>
        </div>
        <div className="stat">
          <span className="muted">Ends</span>
          <strong>{formatDate(booking.ends_at)}</strong>
        </div>
      </div>
      <p className="muted">
        No Stripe checkout has been created in this workflow. Payment remains pending until a real payment provider is wired and settles successfully.
      </p>
      {payment ? (
        <p className="muted">
          Payment record: {humanize(payment.status)} · Platform fee {formatCents(payment.platform_fee_cents)} · Host payout {formatCents(payment.host_payout_cents)}
        </p>
      ) : (
        <p className="muted">No payment record exists yet; booking prep is waiting for the payment provider adapter.</p>
      )}
    </div>
  );
}

export function BidSummary({
  bid,
  opportunity,
  unit,
  bidderName,
  hostName,
}: {
  bid: BidRow;
  opportunity: OpportunityRow | null;
  unit: InventoryUnitRow | null;
  bidderName?: string | null;
  hostName?: string | null;
}) {
  return (
    <div className="stack">
      <div className="card-header">
        <div>
          <p className="eyebrow">{unit?.name ?? "Opportunity bid"}</p>
          <h3>{opportunity?.title ?? "Untitled opportunity"}</h3>
        </div>
        <BidStatusBadge status={bid.status} />
      </div>
      <div className="stat-row">
        <div className="stat">
          <span className="muted">Submitted bid</span>
          <strong>{formatCents(bid.amount_cents)}</strong>
        </div>
        {bid.counter_amount_cents ? (
          <div className="stat">
            <span className="muted">Counter</span>
            <strong>{formatCents(bid.counter_amount_cents)}</strong>
          </div>
        ) : null}
        <div className="stat">
          <span className="muted">Working amount</span>
          <strong>{formatCents(effectiveBidCents(bid))}</strong>
        </div>
      </div>
      <div className="badge-row">
        {bidderName ? <span className="badge">Bidder: {bidderName}</span> : null}
        {hostName ? <span className="badge">Host: {hostName}</span> : null}
        {bid.commerce_layer ? <span className="badge">{humanize(bid.commerce_layer)}</span> : null}
      </div>
      {bid.intended_use ? <p className="muted">{bid.intended_use}</p> : null}
      <BidTimeline status={bid.status} />
    </div>
  );
}

export function BidderBidCard({
  bid,
  opportunity,
  unit,
  booking,
  payment,
  hostName,
}: {
  bid: BidRow;
  opportunity: OpportunityRow | null;
  unit: InventoryUnitRow | null;
  booking: BookingRow | null;
  payment: PaymentRow | null;
  hostName: string | null;
}) {
  return (
    <article className="card stack">
      <BidSummary bid={bid} opportunity={opportunity} unit={unit} hostName={hostName} />
      <BidderGuidance status={bid.status} booking={booking} />
      {booking ? <BookingPrepCard booking={booking} payment={payment} /> : null}
      {statusAllows(bid.status, "withdrawn") ? (
        <form action={withdrawBidAction} className="action-row">
          <input type="hidden" name="bidId" value={bid.id} />
          <input type="hidden" name="returnTo" value="/dashboard/bids" />
          <button className="button-danger" type="submit">Withdraw bid</button>
        </form>
      ) : null}
    </article>
  );
}

export function HostBidCard({
  bid,
  opportunity,
  unit,
  booking,
  payment,
  bidderName,
}: {
  bid: BidRow;
  opportunity: OpportunityRow | null;
  unit: InventoryUnitRow | null;
  booking: BookingRow | null;
  payment: PaymentRow | null;
  bidderName: string | null;
}) {
  return (
    <article className="card stack">
      <BidSummary bid={bid} opportunity={opportunity} unit={unit} bidderName={bidderName} />
      <p className="muted">
        Host selection is curated: use price, fit, timing, and operational needs. The UI intentionally avoids a winner leaderboard.
      </p>
      <HostActionForms bid={bid} />
      {bid.status === "payment_pending" || booking ? <BookingPrepCard booking={booking} payment={payment} /> : null}
    </article>
  );
}

function HostActionForms({ bid }: { bid: BidRow }) {
  return (
    <div className="stack">
      <div className="action-row">
        <HostActionButton bidId={bid.id} action="view" label="Mark viewed" enabled={statusAllows(bid.status, "viewed")} />
        <HostActionButton bidId={bid.id} action="shortlist" label="Shortlist" enabled={statusAllows(bid.status, "shortlisted")} />
        <HostActionButton bidId={bid.id} action="accept" label="Accept" enabled={statusAllows(bid.status, "accepted")} primary />
        <HostActionButton bidId={bid.id} action="waitlist" label="Waitlist" enabled={statusAllows(bid.status, "waitlisted")} />
        <HostActionButton bidId={bid.id} action="reject" label="Reject" enabled={statusAllows(bid.status, "rejected")} danger />
        <HostActionButton bidId={bid.id} action="request_payment" label="Request payment" enabled={bid.status === "accepted" || bid.status === "payment_pending"} primary />
      </div>
      {statusAllows(bid.status, "countered") ? (
        <form action={hostBidAction} className="action-row">
          <input type="hidden" name="bidId" value={bid.id} />
          <input type="hidden" name="action" value="counter" />
          <input type="hidden" name="returnTo" value="/dashboard/host/bids" />
          <input name="counterAmountDollars" inputMode="decimal" placeholder="Counter amount" aria-label="Counter amount" />
          <button className="button-secondary" type="submit">Send counter</button>
        </form>
      ) : null}
    </div>
  );
}

function HostActionButton({
  bidId,
  action,
  label,
  enabled,
  primary,
  danger,
}: {
  bidId: string;
  action: string;
  label: string;
  enabled: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  if (!enabled) return null;
  return (
    <form action={hostBidAction}>
      <input type="hidden" name="bidId" value={bidId} />
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="returnTo" value="/dashboard/host/bids" />
      <button className={danger ? "button-danger" : primary ? "button" : "button-secondary"} type="submit">
        {label}
      </button>
    </form>
  );
}

function BidderGuidance({ status, booking }: { status: BidStatus; booking: BookingRow | null }) {
  if (status === "payment_pending" || booking) {
    return (
      <p className="muted">
        The host has requested payment and opened booking prep. Checkout is not live yet; no money has moved in this workflow.
      </p>
    );
  }
  if (status === "countered") {
    return <p className="muted">The host has sent a counter. Bidder counter-acceptance is a follow-on workflow; contact the host before payment request.</p>;
  }
  if (status === "waitlisted") {
    return <p className="muted">You are waitlisted. The host may still curate final selections from multiple fit signals.</p>;
  }
  if (status === "accepted") {
    return <p className="muted">Accepted by the host. Payment must be requested and completed before booking confirmation.</p>;
  }
  return <p className="muted">Your bid is sealed from other bidders. Only your organization and the host can see the details.</p>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function firstParam(value?: string | string[]): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
