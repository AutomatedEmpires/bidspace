import type { BidspaceClient, MessageRow, MessageThreadRow } from "@bidspace/db";
import { messageCreateSchema, type MessageCreate, type MessageThreadContext } from "@bidspace/core";
import { NotFoundError, ValidationError, fromDbError } from "./errors";

// Messaging stays connected to context: every thread is anchored to a bid,
// a booking, or an opportunity — never an undifferentiated inbox.
export interface ThreadAnchor {
  context: MessageThreadContext;
  bidId?: string;
  bookingId?: string;
  opportunityId?: string;
}

function anchorColumn(anchor: ThreadAnchor): { column: string; value: string } {
  if (anchor.context === "bid" && anchor.bidId) return { column: "bid_id", value: anchor.bidId };
  if (anchor.context === "booking" && anchor.bookingId) {
    return { column: "booking_id", value: anchor.bookingId };
  }
  if (anchor.context === "opportunity" && anchor.opportunityId) {
    return { column: "opportunity_id", value: anchor.opportunityId };
  }
  throw new ValidationError(`Thread anchor is missing the id for context '${anchor.context}'`);
}

export async function getOrCreateThread(
  db: BidspaceClient,
  anchor: ThreadAnchor,
): Promise<MessageThreadRow> {
  const { column, value } = anchorColumn(anchor);
  const existing = await db
    .from("message_threads")
    .select("*")
    .eq("context", anchor.context)
    .eq(column, value)
    .maybeSingle();
  if (existing.error) throw fromDbError("getOrCreateThread", existing.error);
  if (existing.data) return existing.data as MessageThreadRow;

  const { data, error } = await db
    .from("message_threads")
    .insert({ context: anchor.context, [column]: value })
    .select("*")
    .single();
  if (error) throw fromDbError("getOrCreateThread", error);
  return data as MessageThreadRow;
}

export async function getThread(db: BidspaceClient, id: string): Promise<MessageThreadRow> {
  const { data, error } = await db.from("message_threads").select("*").eq("id", id).maybeSingle();
  if (error) throw fromDbError("getThread", error);
  if (!data) throw new NotFoundError("message_thread", id);
  return data as MessageThreadRow;
}

export async function sendMessage(db: BidspaceClient, input: MessageCreate): Promise<MessageRow> {
  const parsed = messageCreateSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError("Invalid message", parsed.error.flatten());
  const m = parsed.data;
  const { data, error } = await db
    .from("messages")
    .insert({
      thread_id: m.threadId,
      sender_user_id: m.senderUserId ?? null,
      sender_organization_id: m.senderOrganizationId,
      body: m.body.trim(),
    })
    .select("*")
    .single();
  if (error) throw fromDbError("sendMessage", error);
  return data as MessageRow;
}

export async function listMessages(db: BidspaceClient, threadId: string): Promise<MessageRow[]> {
  const { data, error } = await db
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw fromDbError("listMessages", error);
  return (data ?? []) as MessageRow[];
}

// Threads with their anchor context, filtered to the ones this organization is
// actually a party to (via the anchoring bid or booking).
export interface ThreadWithContext extends MessageThreadRow {
  bid: {
    id: string;
    bidder_organization_id: string;
    host_organization_id: string | null;
    opportunity_id: string;
  } | null;
  booking: {
    id: string;
    bidder_organization_id: string;
    host_organization_id: string;
    inventory_unit_id: string;
  } | null;
  opportunity: { id: string; title: string; organization_id: string } | null;
}

export function isThreadParty(thread: ThreadWithContext, organizationId: string): boolean {
  if (thread.bid) {
    return (
      thread.bid.bidder_organization_id === organizationId ||
      thread.bid.host_organization_id === organizationId
    );
  }
  if (thread.booking) {
    return (
      thread.booking.bidder_organization_id === organizationId ||
      thread.booking.host_organization_id === organizationId
    );
  }
  if (thread.opportunity) {
    return thread.opportunity.organization_id === organizationId;
  }
  return false;
}

export async function listThreadsForOrg(
  db: BidspaceClient,
  organizationId: string,
): Promise<ThreadWithContext[]> {
  const { data, error } = await db
    .from("message_threads")
    .select(
      `*,
      bid:bids(id, bidder_organization_id, host_organization_id, opportunity_id),
      booking:bookings(id, bidder_organization_id, host_organization_id, inventory_unit_id),
      opportunity:opportunities(id, title, organization_id)`,
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw fromDbError("listThreadsForOrg", error);
  return ((data ?? []) as unknown as ThreadWithContext[]).filter((thread) =>
    isThreadParty(thread, organizationId),
  );
}

export async function getThreadWithContext(
  db: BidspaceClient,
  threadId: string,
): Promise<ThreadWithContext> {
  const { data, error } = await db
    .from("message_threads")
    .select(
      `*,
      bid:bids(id, bidder_organization_id, host_organization_id, opportunity_id),
      booking:bookings(id, bidder_organization_id, host_organization_id, inventory_unit_id),
      opportunity:opportunities(id, title, organization_id)`,
    )
    .eq("id", threadId)
    .maybeSingle();
  if (error) throw fromDbError("getThreadWithContext", error);
  if (!data) throw new NotFoundError("message_thread", threadId);
  return data as unknown as ThreadWithContext;
}
