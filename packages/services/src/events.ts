import type { BidspaceClient, EventRow } from "@bidspace/db";
import { NotFoundError, ValidationError, fromDbError } from "./errors.js";

export interface EventCreateInput {
  organizationId: string;
  venueId?: string;
  name: string;
  startsAt?: string;
  endsAt?: string;
}

export async function createEvent(db: BidspaceClient, input: EventCreateInput): Promise<EventRow> {
  if (!input.name || !input.name.trim()) {
    throw new ValidationError("Event name is required");
  }
  if (input.startsAt && input.endsAt && input.endsAt < input.startsAt) {
    throw new ValidationError("Event endsAt must be on or after startsAt");
  }
  const { data, error } = await db
    .from("events")
    .insert({
      organization_id: input.organizationId,
      venue_id: input.venueId ?? null,
      name: input.name.trim(),
      starts_at: input.startsAt ?? null,
      ends_at: input.endsAt ?? null,
    })
    .select("*")
    .single();
  if (error) throw fromDbError("createEvent", error);
  return data as EventRow;
}

export async function getEvent(db: BidspaceClient, id: string): Promise<EventRow> {
  const { data, error } = await db.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw fromDbError("getEvent", error);
  if (!data) throw new NotFoundError("event", id);
  return data as EventRow;
}

export async function listEventsForOrg(
  db: BidspaceClient,
  organizationId: string,
): Promise<EventRow[]> {
  const { data, error } = await db
    .from("events")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listEventsForOrg", error);
  return (data ?? []) as EventRow[];
}
