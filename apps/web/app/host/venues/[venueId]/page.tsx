import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  NotFoundError,
  ServiceError,
  activateVenue,
  getVenue,
  listOpportunitiesForOrg,
  updateVenue,
} from "@bidspace/services";
import {
  Button,
  CheckboxField,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  StatusBadge,
  Textarea,
  buttonClasses,
} from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";

export const metadata: Metadata = { title: "Location" };
export const dynamic = "force-dynamic";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const context = await requireHostContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const { venueId } = await params;
  let venue;
  try {
    venue = await getVenue(db, venueId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  if (venue.organization_id !== context.activeDbOrganizationId) notFound();

  const opportunities = (await listOpportunitiesForOrg(db, context.activeDbOrganizationId)).filter(
    (o) => o.venue_id === venueId,
  );

  async function updateVenueAction(formData: FormData) {
    "use server";
    const current = await requireHostContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const existing = await getVenue(serverDb, venueId);
    if (existing.organization_id !== current.activeDbOrganizationId) return;

    const value = (key: string) => String(formData.get(key) ?? "").trim();
    const imageUrls = value("imageUrls")
      .split(/\s+/)
      .map((u) => u.trim())
      .filter(Boolean);
    try {
      await updateVenue(serverDb, venueId, {
        name: value("name") || undefined,
        description: value("description") || undefined,
        capacity: value("capacity") ? Number(value("capacity")) : undefined,
        parkingInfo: value("parkingInfo") || undefined,
        accessInstructions: value("accessInstructions") || undefined,
        restroomInfo: value("restroomInfo") || undefined,
        powerAvailable: formData.get("powerAvailable") === "on",
        waterAvailable: formData.get("waterAvailable") === "on",
        wifiAvailable: formData.get("wifiAvailable") === "on",
        imageUrls: imageUrls.length ? imageUrls : undefined,
      });
      if (existing.status === "draft") {
        await activateVenue(serverDb, venueId);
      }
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    revalidatePath(`/host/venues/${venueId}`);
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Location"
        title={venue.name}
        lede={`${venue.address_line_1}, ${venue.city}, ${venue.state}`}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={venue.status} />
            <Link href={`/host/opportunities/new?venueId=${venue.id}`} className={buttonClasses("signal", "md")}>
              Release inventory here
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel>
          <PanelHeader title="Location details" kicker="Public + operational" />
          <PanelBody>
            <form action={updateVenueAction} className="grid gap-4">
              <Field label="Name" htmlFor="name">
                <Input id="name" name="name" defaultValue={venue.name} />
              </Field>
              <Field label="Public description" htmlFor="description">
                <Textarea id="description" name="description" rows={4} defaultValue={venue.description ?? ""} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Typical audience / capacity" htmlFor="capacity">
                  <Input id="capacity" name="capacity" type="number" min={0} defaultValue={venue.capacity ?? ""} />
                </Field>
                <div className="grid content-end gap-2 pb-1">
                  <CheckboxField name="powerAvailable" label="Power available" defaultChecked={venue.power_available ?? false} />
                  <CheckboxField name="waterAvailable" label="Water available" defaultChecked={venue.water_available ?? false} />
                  <CheckboxField name="wifiAvailable" label="Wi-Fi available" defaultChecked={venue.wifi_available ?? false} />
                </div>
              </div>
              <Field label="Parking (public)" htmlFor="parkingInfo">
                <Textarea id="parkingInfo" name="parkingInfo" rows={2} defaultValue={venue.parking_info ?? ""} />
              </Field>
              <Field label="Restrooms (public)" htmlFor="restroomInfo">
                <Input id="restroomInfo" name="restroomInfo" defaultValue={venue.restroom_info ?? ""} />
              </Field>
              <Field
                label="Access instructions (booked vendors only)"
                htmlFor="accessInstructions"
                hint="Gate codes, load-in doors, site contacts. Never shown publicly — unlocked to a vendor once their booking confirms."
              >
                <Textarea
                  id="accessInstructions"
                  name="accessInstructions"
                  rows={3}
                  defaultValue={venue.access_instructions ?? ""}
                />
              </Field>
              <Field label="Image URLs" htmlFor="imageUrls" hint="One per line — real photos of the place.">
                <Textarea id="imageUrls" name="imageUrls" rows={2} defaultValue={(venue.image_urls ?? []).join("\n")} />
              </Field>
              <Button type="submit" variant="primary" size="md" className="justify-self-start">
                Save location
              </Button>
            </form>
          </PanelBody>
        </Panel>

        <aside className="grid content-start gap-4">
          <Panel>
            <PanelHeader title="Releases from this location" kicker={`${opportunities.length} total`} />
            <PanelBody>
              {opportunities.length > 0 ? (
                <ul className="grid gap-2">
                  {opportunities.slice(0, 8).map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/host/opportunities/${o.id}`}
                        className="flex items-center justify-between gap-2 text-sm hover:underline"
                      >
                        <span className="truncate font-medium">{o.title}</span>
                        <StatusBadge status={o.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted dark:text-canvas-muted">
                  No opportunities yet. Release this location&apos;s inventory when you are ready.
                </p>
              )}
            </PanelBody>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
