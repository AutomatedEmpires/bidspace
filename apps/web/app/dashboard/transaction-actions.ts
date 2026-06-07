"use server";

import type { BidStatus } from "@bidspace/core";
import {
  acceptHostBid,
  counterHostBid,
  placeBid,
  rejectHostBid,
  shortlistHostBid,
  viewHostBid,
  waitlistHostBid,
  withdrawBidderBid,
} from "@bidspace/services";
import { prepareHostBookingPaymentForBid } from "@bidspace/services";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerBidspaceClient } from "@/lib/bidspace-server";
import { requireActiveOrganization, WorkflowError } from "@/lib/transaction-workflow";

type HostAction = "view" | "shortlist" | "accept" | "reject" | "waitlist" | "counter" | "request_payment";

function failureRedirect(path: string, error: unknown): never {
  const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function successRedirect(path: string, message: string): never {
  redirect(`${path}?success=${encodeURIComponent(message)}`);
}

function requiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new WorkflowError(`${key} is required.`, "invalid");
  }
  return value.trim();
}

function parseCents(value: FormDataEntryValue | null, label: string): number {
  if (typeof value !== "string") {
    throw new WorkflowError(`${label} is required.`, "invalid");
  }
  const dollars = Number(value);
  if (!Number.isFinite(dollars) || dollars <= 0) {
    throw new WorkflowError(`${label} must be a positive dollar amount.`, "invalid");
  }
  return Math.round(dollars * 100);
}

export async function submitBidAction(formData: FormData) {
  const returnTo = typeof formData.get("returnTo") === "string" ? String(formData.get("returnTo")) : "/dashboard/bids";
  try {
    const org = await requireActiveOrganization("bidder");
    const db = createServerBidspaceClient();
    const opportunityId = requiredString(formData, "opportunityId");
    const inventoryUnitId = requiredString(formData, "inventoryUnitId");
    const amountCents = parseCents(formData.get("amountDollars"), "Bid amount");
    const intendedUse = typeof formData.get("intendedUse") === "string" ? String(formData.get("intendedUse")).trim() : "";
    const commerceLayerValue = formData.get("commerceLayer");
    const commerceLayer = typeof commerceLayerValue === "string" && commerceLayerValue.length > 0 ? commerceLayerValue : undefined;

    await placeBid(db, {
      bidderOrganizationId: org.organizationId,
      opportunityId,
      inventoryUnitId,
      amountCents,
      commerceLayer: commerceLayer as never,
      intendedUse: intendedUse || undefined,
    });

    revalidatePath("/dashboard/bids");
    revalidatePath(returnTo);
  } catch (error) {
    failureRedirect(returnTo, error);
  }
  successRedirect(returnTo, "Bid submitted. It is sealed from competing bidders.");
}

export async function withdrawBidAction(formData: FormData) {
  const returnTo = typeof formData.get("returnTo") === "string" ? String(formData.get("returnTo")) : "/dashboard/bids";
  try {
    const org = await requireActiveOrganization("bidder");
    const db = createServerBidspaceClient();
    const bidId = requiredString(formData, "bidId");
    await withdrawBidderBid(db, bidId, org.organizationId);
    revalidatePath("/dashboard/bids");
    revalidatePath(returnTo);
  } catch (error) {
    failureRedirect(returnTo, error);
  }
  successRedirect(returnTo, "Bid withdrawn.");
}

export async function hostBidAction(formData: FormData) {
  const returnTo = typeof formData.get("returnTo") === "string" ? String(formData.get("returnTo")) : "/dashboard/host/bids";
  try {
    const org = await requireActiveOrganization("host");
    const db = createServerBidspaceClient();
    const bidId = requiredString(formData, "bidId");
    const action = requiredString(formData, "action") as HostAction;

    const handlers: Record<Exclude<HostAction, "counter" | "request_payment">, () => Promise<unknown>> = {
      view: () => viewHostBid(db, bidId, org.organizationId),
      shortlist: () => shortlistHostBid(db, bidId, org.organizationId),
      accept: () => acceptHostBid(db, bidId, org.organizationId),
      reject: () => rejectHostBid(db, bidId, org.organizationId),
      waitlist: () => waitlistHostBid(db, bidId, org.organizationId),
    };

    if (action === "counter") {
      const counterAmountCents = parseCents(formData.get("counterAmountDollars"), "Counter amount");
      await counterHostBid(db, bidId, org.organizationId, counterAmountCents);
    } else if (action === "request_payment") {
      await prepareHostBookingPaymentForBid(db, bidId, org.organizationId);
    } else {
      const handler = handlers[action as keyof typeof handlers];
      if (!handler) throw new WorkflowError(`Unsupported host bid action: ${action}`, "invalid");
      await handler();
    }

    revalidatePath("/dashboard/host/bids");
    revalidatePath("/dashboard/bids");
    revalidatePath(returnTo);
  } catch (error) {
    failureRedirect(returnTo, error);
  }
  successRedirect(returnTo, "Bid pipeline updated.");
}

export function actionLabel(status: BidStatus): string {
  switch (status) {
    case "accepted":
      return "Accepted — request payment when ready";
    case "payment_pending":
      return "Payment requested — booking prep open";
    default:
      return "Pipeline action available";
  }
}
