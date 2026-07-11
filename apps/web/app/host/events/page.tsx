import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ValidationError, createEvent, listEventsForOrg, listVenuesForOrg } from "@bidspace/services";
import { EVENT_TYPE } from "@bidspace/core";
import {
  Button,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  Select,
  StatusBadge,
  Table,
  TBody,
  TD,
  TH,
  THead,
} from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";
import { formatDateRange } from "@/lib/format";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

export default async function HostEventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireHostContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const params = await searchParams;
  const errorMessage = typeof params.error === "string" ? decodeURIComponent(params.error) : null;

  const [events, venues] = await Promise.all([
    listEventsForOrg(db, context.activeDbOrganizationId),
    listVenuesForOrg(db, context.activeDbOrganizationId),
  ]);

  async function createEventAction(formData: FormData) {
    "use server";
    const current = await requireHostContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const value = (key: string) => String(formData.get(key) ?? "").trim();
    try {
      await createEvent(serverDb, {
        organizationId: current.activeDbOrganizationId,
        venueId: value("venueId") || undefined,
        name: value("name"),
        eventType: value("eventType") as (typeof EVENT_TYPE)[number],
        startsAt: new Date(value("startsAt")).toISOString(),
        endsAt: new Date(value("endsAt")).toISOString(),
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        redirect(`/host/events?error=${encodeURIComponent(error.message)}`);
      }
      throw error;
    }
    redirect("/host/events");
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Events"
        title="Events & seasons"
        lede="An event gives a release its audience context: dates, expected attendance, the reason vendors want in."
      />

      <Panel>
        <PanelHeader title="Create an event" kicker="Recurring markets welcome" />
        <PanelBody>
          {errorMessage ? (
            <p role="alert" className="mb-4 rounded-[3px] border border-alert/40 bg-alert/[0.06] px-3 py-2 text-sm font-medium text-alert">
              {errorMessage}
            </p>
          ) : null}
          <form action={createEventAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Event name" htmlFor="name" required className="lg:col-span-2">
              <Input id="name" name="name" required placeholder="Downtown Summer Market" />
            </Field>
            <Field label="Type" htmlFor="eventType" required>
              <Select id="eventType" name="eventType" defaultValue="market" required>
                {EVENT_TYPE.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Starts" htmlFor="startsAt" required>
              <Input id="startsAt" name="startsAt" type="datetime-local" required />
            </Field>
            <Field label="Ends" htmlFor="endsAt" required>
              <Input id="endsAt" name="endsAt" type="datetime-local" required />
            </Field>
            <Field label="Location" htmlFor="venueId" className="sm:col-span-2 lg:col-span-3">
              <Select id="venueId" name="venueId" defaultValue="">
                <option value="">No linked location</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} — {venue.city}, {venue.state}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" variant="signal" size="md" className="self-end lg:col-span-2">
              Create event
            </Button>
          </form>
        </PanelBody>
      </Panel>

      {events.length > 0 ? (
        <Table>
          <THead>
            <tr>
              <TH>Event</TH>
              <TH>Type</TH>
              <TH>Dates</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {events.map((event) => (
              <tr key={event.id}>
                <TD className="font-medium">{event.name}</TD>
                <TD className="text-ink-muted dark:text-canvas-muted">{event.event_type.replace(/_/g, " ")}</TD>
                <TD>{formatDateRange(event.starts_at, event.ends_at)}</TD>
                <TD>
                  <StatusBadge status={event.status} />
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
      ) : (
        <EmptyState
          icon="event"
          title="No events yet"
          body="Create the fair, market, or season your inventory belongs to — then release opportunities against it."
        />
      )}
    </div>
  );
}
