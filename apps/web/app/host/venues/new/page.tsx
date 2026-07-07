import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ValidationError, createVenue } from "@bidspace/services";
import { VENUE_TYPE } from "@bidspace/core";
import { Button, Field, Input, PageHeader, Panel, PanelBody, Select, Textarea } from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";

export const metadata: Metadata = { title: "Add location" };

export default async function NewVenuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireHostContext();
  const params = await searchParams;
  const errorMessage = typeof params.error === "string" ? decodeURIComponent(params.error) : null;

  async function createVenueAction(formData: FormData) {
    "use server";
    const context = await requireHostContext();
    const db = tryGetDb();
    if (!db) redirect("/host/venues/new?error=Database%20not%20configured");

    const value = (key: string) => String(formData.get(key) ?? "").trim();
    try {
      const venue = await createVenue(db, {
        organizationId: context.activeDbOrganizationId,
        name: value("name"),
        venueType: value("venueType") as (typeof VENUE_TYPE)[number],
        addressLine1: value("addressLine1"),
        addressLine2: value("addressLine2") || undefined,
        city: value("city"),
        state: value("state"),
        postalCode: value("postalCode") || undefined,
        country: "US",
        latitude: Number(value("latitude")),
        longitude: Number(value("longitude")),
      });
      // Description/amenities are draft-stage optional; persist if provided.
      const description = value("description");
      if (description) {
        await db.from("venues").update({ description }).eq("id", venue.id);
      }
      redirect(`/host/venues/${venue.id}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        redirect(`/host/venues/new?error=${encodeURIComponent(error.message)}`);
      }
      throw error;
    }
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Locations"
        title="Add a location"
        lede="Exact coordinates power map discovery. Use the venue centre point — individual positions come later."
      />
      <Panel className="max-w-3xl">
        <PanelBody>
          {errorMessage ? (
            <p role="alert" className="mb-4 rounded-[3px] border border-alert/40 bg-alert/[0.06] px-3 py-2 text-sm font-medium text-alert">
              {errorMessage}
            </p>
          ) : null}
          <form action={createVenueAction} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
              <Field label="Location name" htmlFor="name" required>
                <Input id="name" name="name" required placeholder="Spokane County Fairgrounds" />
              </Field>
              <Field label="Type" htmlFor="venueType" required>
                <Select id="venueType" name="venueType" defaultValue="fairgrounds" required>
                  {VENUE_TYPE.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Street address" htmlFor="addressLine1" required>
              <Input id="addressLine1" name="addressLine1" required placeholder="404 N Havana St" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City" htmlFor="city" required>
                <Input id="city" name="city" required placeholder="Spokane Valley" />
              </Field>
              <Field label="State" htmlFor="state" required>
                <Input id="state" name="state" required maxLength={2} placeholder="WA" />
              </Field>
              <Field label="Postal code" htmlFor="postalCode">
                <Input id="postalCode" name="postalCode" placeholder="99202" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Latitude" htmlFor="latitude" required hint="Decimal degrees, e.g. 47.6588">
                <Input id="latitude" name="latitude" type="number" step="any" min={-90} max={90} required />
              </Field>
              <Field label="Longitude" htmlFor="longitude" required hint="Decimal degrees, e.g. -117.4260">
                <Input id="longitude" name="longitude" type="number" step="any" min={-180} max={180} required />
              </Field>
            </div>
            <Field
              label="Public description"
              htmlFor="description"
              hint="What vendors should know about the place and its audience. Operational details stay private."
            >
              <Textarea id="description" name="description" rows={4} />
            </Field>
            <Button type="submit" variant="signal" size="lg" className="justify-self-start">
              Create location
            </Button>
          </form>
        </PanelBody>
      </Panel>
    </div>
  );
}
