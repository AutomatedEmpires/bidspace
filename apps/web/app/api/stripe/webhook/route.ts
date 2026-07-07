import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import {
  ServiceError,
  TransitionError,
  recordPaymentResult,
  settleBookingPayment,
  transitionInventoryUnit,
  getBooking,
} from "@bidspace/services";
import type { PaymentRow } from "@bidspace/db";
import { getStripe, isStripeEnabled } from "@/lib/stripe";
import { tryGetDb } from "@/lib/safe-db";

export const dynamic = "force-dynamic";

// Stripe → BidSpace settlement path. Verified signature, idempotent by event
// id (stripe_webhook_events PK), state machines guard every transition.
export async function POST(request: NextRequest) {
  if (!isStripeEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const db = tryGetDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = getStripe().webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency: the event id is the primary key; a duplicate delivery is a no-op.
  const inserted = await db
    .from("stripe_webhook_events")
    .insert({ id: event.id, event_type: event.type });
  if (inserted.error) {
    const alreadyProcessed = inserted.error.code === "23505";
    if (alreadyProcessed) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: "Ledger write failed" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const bookingId = session.metadata?.booking_id;
        if (!bookingId) break;

        const paymentResult = await db
          .from("payments")
          .select("*")
          .eq("booking_id", bookingId)
          .in("status", ["pending", "authorized"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const payment = paymentResult.data as PaymentRow | null;
        if (payment) {
          await recordPaymentResult(db, payment.id, "paid", {
            stripe_payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : payment.stripe_payment_intent_id,
          });
        }

        const booking = await getBooking(db, bookingId);
        if (booking.status === "pending_payment") {
          await settleBookingPayment(db, bookingId);
          // Advance the unit to booked along whichever legal path it is on.
          try {
            await transitionInventoryUnit(db, booking.inventory_unit_id, "booked");
          } catch (error) {
            if (error instanceof TransitionError) {
              try {
                await transitionInventoryUnit(db, booking.inventory_unit_id, "payment_pending");
                await transitionInventoryUnit(db, booking.inventory_unit_id, "booked");
              } catch {
                // Unit state is advisory; the booking + payment are authoritative.
              }
            } else {
              throw error;
            }
          }
        }
        break;
      }
      case "checkout.session.expired":
      case "payment_intent.payment_failed": {
        const object = event.data.object as { metadata?: Record<string, string> };
        const bookingId = object.metadata?.booking_id;
        if (!bookingId) break;
        const paymentResult = await db
          .from("payments")
          .select("*")
          .eq("booking_id", bookingId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const payment = paymentResult.data as PaymentRow | null;
        if (payment) {
          await recordPaymentResult(db, payment.id, "failed", {
            failure_reason: event.type,
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    if (!(error instanceof ServiceError)) throw error;
    // Guarded transitions can legally reject replays/out-of-order events;
    // acknowledge so Stripe stops retrying a delivery we cannot apply.
  }

  return NextResponse.json({ received: true });
}
