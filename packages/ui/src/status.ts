// Maps every marketplace status vocabulary onto one small set of visual tones
// so status colour semantics stay consistent across bids, bookings, payments,
// opportunities, units, and verification — one legend for the whole product.

export type StatusTone = "positive" | "active" | "attention" | "negative" | "neutral";

const TONE_BY_STATUS: Record<string, StatusTone> = {
  // Live / open for business
  published: "active",
  receiving_bids: "active",
  available: "active",
  active: "active",
  in_progress: "active",
  upcoming: "active",

  // Good terminal or confirmed states
  accepted: "positive",
  paid: "positive",
  booked: "positive",
  confirmed: "positive",
  completed: "positive",
  verified: "positive",
  paid_out: "positive",
  reviewed: "positive",
  filled: "positive",

  // Needs someone's decision or money movement
  submitted: "attention",
  viewed: "attention",
  shortlisted: "attention",
  countered: "attention",
  waitlisted: "attention",
  payment_pending: "attention",
  pending_payment: "attention",
  pending: "attention",
  pending_verification: "attention",
  reserved: "attention",
  authorized: "attention",
  requested: "attention",
  invited: "attention",
  uploaded: "attention",
  flagged: "attention",

  // Failed / refused / stopped
  rejected: "negative",
  declined: "negative",
  cancelled: "negative",
  disputed: "negative",
  failed: "negative",
  expired: "negative",
  suspended: "negative",
  refunded: "negative",
  partially_refunded: "negative",
  revoked: "negative",
  removed: "negative",

  // Quiet states
  draft: "neutral",
  closed: "neutral",
  withdrawn: "neutral",
  archived: "neutral",
  hidden: "neutral",
  not_started: "neutral",
};

export function statusTone(status: string): StatusTone {
  return TONE_BY_STATUS[status] ?? "neutral";
}

export function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}
