import type {
  BidStatus,
  BookingStatus,
  PaymentStatus,
  InventoryUnitStatus,
  OpportunityStatus,
} from "./enums.js";

export type TransitionMap<S extends string> = Readonly<Record<S, readonly S[]>>;

export function canTransition<S extends string>(map: TransitionMap<S>, from: S, to: S): boolean {
  return map[from]?.includes(to) ?? false;
}

export function assertTransition<S extends string>(map: TransitionMap<S>, from: S, to: S): void {
  if (!canTransition(map, from, to)) {
    throw new Error(`Illegal transition: ${from} -> ${to}`);
  }
}

export function nextStates<S extends string>(map: TransitionMap<S>, from: S): readonly S[] {
  return map[from] ?? [];
}

// A bid is the core marketplace primitive: an offer against an opportunity or unit.
export const bidStatusTransitions: TransitionMap<BidStatus> = {
  draft: ["submitted", "withdrawn"],
  submitted: ["viewed", "shortlisted", "countered", "rejected", "waitlisted", "withdrawn", "expired"],
  viewed: ["shortlisted", "countered", "accepted", "rejected", "waitlisted", "withdrawn", "expired"],
  shortlisted: ["accepted", "countered", "rejected", "waitlisted", "withdrawn", "expired"],
  countered: ["submitted", "accepted", "rejected", "withdrawn", "expired"],
  waitlisted: ["accepted", "rejected", "withdrawn", "expired"],
  accepted: ["payment_pending", "withdrawn"],
  payment_pending: ["paid", "rejected", "expired"],
  paid: ["booked"],
  booked: ["completed"],
  completed: ["reviewed"],
  rejected: [],
  withdrawn: [],
  expired: [],
  reviewed: [],
};

export const bookingStatusTransitions: TransitionMap<BookingStatus> = {
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["upcoming", "cancelled", "disputed"],
  upcoming: ["in_progress", "cancelled", "disputed"],
  in_progress: ["completed", "disputed"],
  completed: ["reviewed", "disputed"],
  disputed: ["completed", "cancelled", "reviewed"],
  cancelled: [],
  reviewed: [],
};

export const paymentStatusTransitions: TransitionMap<PaymentStatus> = {
  pending: ["authorized", "paid", "failed"],
  authorized: ["paid", "failed", "refunded"],
  paid: ["paid_out", "refunded", "partially_refunded", "disputed"],
  paid_out: ["refunded", "partially_refunded", "disputed"],
  failed: ["pending"],
  refunded: [],
  partially_refunded: ["refunded", "disputed"],
  disputed: ["refunded", "partially_refunded", "paid_out"],
};

export const inventoryUnitStatusTransitions: TransitionMap<InventoryUnitStatus> = {
  draft: ["available", "archived"],
  available: ["receiving_bids", "reserved", "cancelled", "archived"],
  receiving_bids: ["shortlisted", "reserved", "available", "cancelled"],
  shortlisted: ["reserved", "receiving_bids", "available", "cancelled"],
  reserved: ["payment_pending", "available", "cancelled"],
  payment_pending: ["booked", "available", "cancelled"],
  booked: ["completed", "cancelled"],
  completed: ["archived"],
  cancelled: ["available", "archived"],
  archived: [],
};

export const opportunityStatusTransitions: TransitionMap<OpportunityStatus> = {
  draft: ["published", "archived"],
  published: ["receiving_bids", "closed", "cancelled", "archived"],
  receiving_bids: ["closed", "filled", "cancelled"],
  closed: ["receiving_bids", "filled", "completed", "archived"],
  filled: ["completed", "archived"],
  completed: ["archived"],
  cancelled: ["archived"],
  archived: [],
};
