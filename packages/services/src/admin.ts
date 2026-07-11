import type { BidspaceClient, AdminActionRow } from "@bidspace/db";
import type { AdminActionType } from "@bidspace/core";
import { fromDbError } from "./errors";

// Admin is an operating system: the home answers "what requires intervention?"
export interface AdminQueueCounts {
  pendingVerifications: number;
  flaggedReviews: number;
  disputedBookings: number;
  failedPayments: number;
  pendingOrganizations: number;
}

export async function getAdminQueueCounts(db: BidspaceClient): Promise<AdminQueueCounts> {
  const [verifications, reviews, bookings, payments, organizations] = await Promise.all([
    db.from("verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("reviews").select("id", { count: "exact", head: true }).eq("status", "flagged"),
    db.from("bookings").select("id", { count: "exact", head: true }).eq("status", "disputed"),
    db.from("payments").select("id", { count: "exact", head: true }).in("status", ["failed", "disputed"]),
    db
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_verification"),
  ]);
  for (const result of [verifications, reviews, bookings, payments, organizations]) {
    if (result.error) throw fromDbError("getAdminQueueCounts", result.error);
  }
  return {
    pendingVerifications: verifications.count ?? 0,
    flaggedReviews: reviews.count ?? 0,
    disputedBookings: bookings.count ?? 0,
    failedPayments: payments.count ?? 0,
    pendingOrganizations: organizations.count ?? 0,
  };
}

export async function recordAdminAction(
  db: BidspaceClient,
  input: {
    adminUserId: string;
    actionType: AdminActionType;
    targetType?: string;
    targetId?: string;
    notes?: string;
  },
): Promise<AdminActionRow> {
  const { data, error } = await db
    .from("admin_actions")
    .insert({
      admin_user_id: input.adminUserId,
      action_type: input.actionType,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw fromDbError("recordAdminAction", error);
  return data as AdminActionRow;
}
