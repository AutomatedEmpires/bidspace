import type { BidspaceClient, BookingRow } from "@bidspace/db";
import { type BookingStatus, bookingStatusTransitions, canTransition } from "@bidspace/core";
import { NotFoundError, TransitionError, ValidationError, fromDbError } from "./errors.js";
import { getBid, transitionBid } from "./bidding.js";
import { getInventoryUnit } from "./inventory-units.js";

// A booking is created in `pending_payment` as soon as a host moves an accepted
// bid into payment, then advances to `confirmed` once payment settles. Creating
// the booking first keeps payments.booking_id satisfiable before money moves.
export async function createBookingForBid(db: BidspaceClient, bidId: string): Promise<BookingRow> {
  const bid = await getBid(db, bidId);
  if (bid.status !== "payment_pending") {
    throw new ValidationError(
      `Bid must be in payment_pending to create a booking (got: ${bid.status})`,
    );
  }
  if (!bid.inventory_unit_id) {
    throw new ValidationError("Cannot book a bid that is not tied to an inventory unit");
  }
  if (!bid.host_organization_id) {
    throw new ValidationError("Bid is missing its host organization");
  }
  const unit = await getInventoryUnit(db, bid.inventory_unit_id);
  const priceCents = bid.counter_amount_cents ?? bid.amount_cents;

  const { data, error } = await db
    .from("bookings")
    .insert({
      bid_id: bid.id,
      inventory_unit_id: unit.id,
      bidder_organization_id: bid.bidder_organization_id,
      host_organization_id: bid.host_organization_id,
      price_cents: priceCents,
      starts_at: unit.availability_start,
      ends_at: unit.availability_end,
      status: "pending_payment" satisfies BookingStatus,
    })
    .select("*")
    .single();
  if (error) throw fromDbError("createBookingForBid", error);
  return data as BookingRow;
}

export async function getBooking(db: BidspaceClient, id: string): Promise<BookingRow> {
  const { data, error } = await db.from("bookings").select("*").eq("id", id).maybeSingle();
  if (error) throw fromDbError("getBooking", error);
  if (!data) throw new NotFoundError("booking", id);
  return data as BookingRow;
}

export async function transitionBooking(
  db: BidspaceClient,
  id: string,
  to: BookingStatus,
): Promise<BookingRow> {
  const current = await getBooking(db, id);
  if (!canTransition(bookingStatusTransitions, current.status, to)) {
    throw new TransitionError(`Illegal booking transition: ${current.status} -> ${to}`);
  }
  const { data, error } = await db
    .from("bookings")
    .update({ status: to })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromDbError("transitionBooking", error);
  return data as BookingRow;
}

// Called once the payment for a booking has settled as `paid`. Confirms the
// booking and advances the originating bid payment_pending -> paid -> booked.
// Inventory-unit status advancement remains the caller's responsibility via
// transitionInventoryUnit, since the legal path depends on prior reservation.
export async function settleBookingPayment(
  db: BidspaceClient,
  bookingId: string,
): Promise<BookingRow> {
  const booking = await getBooking(db, bookingId);
  const confirmed = await transitionBooking(db, bookingId, "confirmed");
  await transitionBid(db, booking.bid_id, "paid");
  await transitionBid(db, booking.bid_id, "booked");
  return confirmed;
}
