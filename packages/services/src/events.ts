import type { BidspaceClient, EventRow } from "@bidspace/db";
import { eventCreateSchema, type EventCreate, type EventStatus } from "@bidspace/core";
import { NotFoundError, ValidationError, fromDbError } from "./errors";

export async function createEvent(db: BidspaceClient, input: EventCreate): Promise<EventRow> {
  const parsed = eventCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid event input", parsed.error.flatten());
  }
  const e = parsed.data;
  const { data, error } = await db
    .from("events")
    .insert({
      organization_id: e.organizationId,
      venue_id: e.venueId ?? null,
      name: e.name.trim(),
      event_type: e.eventType,
      starts_at: e.startsAt,
      ends_at: e.endsAt,
      timezone: e.timezone ?? null,
      status: "draft" satisfies EventStatus,
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
