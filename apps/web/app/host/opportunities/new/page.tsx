import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ValidationError,
  createOpportunity,
  listEventsForOrg,
  listVenuesForOrg,
  updateOpportunity,
} from "@bidspace/services";
import { ALLOCATION_MODE, COMMERCE_LAYER, PRICING_MODE, toCents } from "@bidspace/core";
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
  Textarea,
} from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";

export const metadata: Metadata = { title: "New opportunity" };
export const dynamic = "force-dynamic";

const PRICING_HELP: Record<string, string> = {
  fixed: "You set the price; eligible vendors book it.",
  minimum_bid: "Offers start at your floor; you select the winner.",
  competitive_bid: "Sealed competitive offers; you select on fit and value.",
  hybrid: "Bids from a floor, with optional buy-now on individual positions.",
};

const ALLOCATION_LABEL: Record<string, string> = {
  bid: "Sealed bid",
  application: "Application",
  invite_only: "Invite only",
  fixed_fee: "Fixed fee + host approval",
  host_approval: "Host approval",
  waitlist: "Waitlist intake",
};

export default async function NewOpportunityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireHostContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const params = await searchParams;
  const errorMessage = typeof params.error === "string" ? decodeURIComponent(params.error) : null;
  const preselectedVenueId = typeof params.venueId === "string" ? params.venueId : "";

  const [venues, events] = await Promise.all([
    listVenuesForOrg(db, context.activeDbOrganizationId),
    listEventsForOrg(db, context.activeDbOrganizationId),
  ]);

  async function createOpportunityAction(formData: FormData) {
    "use server";
    const current = await requireHostContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const value = (key: string) => String(formData.get(key) ?? "").trim();

    let opportunityId: string;
    try {
      const minimumBid = value("minimumBidDollars");
      const created = await createOpportunity(serverDb, {
        organizationId: current.activeDbOrganizationId,
        title: value("title"),
        venueId: value("venueId") || undefined,
        eventId: value("eventId") || undefined,
        pricingMode: (value("pricingMode") || "hybrid") as (typeof PRICING_MODE)[number],
        commerceLayer: (value("commerceLayer") || undefined) as (typeof COMMERCE_LAYER)[number] | undefined,
        minimumBidCents: minimumBid ? toCents(Number(minimumBid)) : undefined,
        bidDeadline: value("bidDeadline") ? new Date(value("bidDeadline")).toISOString() : undefined,
        allocationMode: (value("allocationMode") || "bid") as (typeof ALLOCATION_MODE)[number],
      });
      opportunityId = created.id;

      // Second write for the descriptive fields the create schema keeps lean.
      const tags = value("categoryTags")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      await updateOpportunity(serverDb, opportunityId, {
        description: value("description") || undefined,
        audienceProfile: value("audienceProfile") || undefined,
        estimatedAttendance: value("estimatedAttendance") ? Number(value("estimatedAttendance")) : undefined,
        categoryTags: tags.length ? tags : undefined,
        startsAt: value("startsAt") ? new Date(value("startsAt")).toISOString() : undefined,
        endsAt: value("endsAt") ? new Date(value("endsAt")).toISOString() : undefined,
        visibility: (value("visibility") || "public") as "public" | "network" | "invite_only",
        allocationMode: (value("allocationMode") || "bid") as (typeof ALLOCATION_MODE)[number],
        requirements: {
          insuranceRequired: formData.get("insuranceRequired") === "on",
          permitRequired: formData.get("permitRequired") === "on",
          rules: value("rules") || null,
          vendorRequirements: value("vendorRequirements") || null,
        },
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        redirect(`/host/opportunities/new?error=${encodeURIComponent(error.message)}`);
      }
      throw error;
    }
    redirect(`/host/opportunities/${opportunityId}`);
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Space listing"
        title="Create a temporary vendor-space listing"
        lede="Describe the place, dates, audience, requirements, and placement method. Every listing stays a non-binding draft until you release it."
      />

      <Panel className="max-w-4xl">
        <PanelHeader title="1 · The space release" kicker="Draft — nothing is public yet" />
        <PanelBody>
          {errorMessage ? (
            <p role="alert" className="mb-4 rounded-[3px] border border-alert/40 bg-alert/[0.06] px-3 py-2 text-sm font-medium text-alert">
              {errorMessage}
            </p>
          ) : null}
          <form action={createOpportunityAction} className="grid gap-5">
            <Field label="Title" htmlFor="title" required hint="What vendors will see first — name the event or the access.">
              <Input id="title" name="title" required placeholder="Downtown Summer Market — Food Vendor Positions" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Location" htmlFor="venueId">
                <Select id="venueId" name="venueId" defaultValue={preselectedVenueId}>
                  <option value="">No linked location</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name} — {venue.city}, {venue.state}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Event / season" htmlFor="eventId">
                <Select id="eventId" name="eventId" defaultValue="">
                  <option value="">No linked event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Description" htmlFor="description" hint="Audience, foot traffic, what makes this worth competing for.">
              <Textarea id="description" name="description" rows={4} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Operating window starts" htmlFor="startsAt">
                <Input id="startsAt" name="startsAt" type="datetime-local" />
              </Field>
              <Field label="Operating window ends" htmlFor="endsAt">
                <Input id="endsAt" name="endsAt" type="datetime-local" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Placement method" htmlFor="allocationMode">
                <Select id="allocationMode" name="allocationMode" defaultValue="bid">
                  {ALLOCATION_MODE.map((mode) => (
                    <option key={mode} value={mode}>
                      {ALLOCATION_LABEL[mode]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Price structure" htmlFor="pricingMode" hint={PRICING_HELP.hybrid}>
                <Select id="pricingMode" name="pricingMode" defaultValue="hybrid">
                  {PRICING_MODE.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Floor price (USD)" htmlFor="minimumBidDollars">
                <Input id="minimumBidDollars" name="minimumBidDollars" type="number" min={0} step="0.01" placeholder="650.00" />
              </Field>
              <Field label="Submission deadline" htmlFor="bidDeadline">
                <Input id="bidDeadline" name="bidDeadline" type="datetime-local" />
              </Field>
            </div>

            <div className="grid gap-4 rounded-[4px] border border-line bg-canvas p-4 dark:bg-ink sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="font-display font-semibold">Requirements &amp; verification</p>
                <p className="mt-1 text-sm text-ink-muted dark:text-canvas-muted">
                  Be explicit before vendors bid or apply. Verification is evidence-based and never implied.
                </p>
              </div>
              <Field label="Rules" htmlFor="rules" hint="Access, prohibited items, conduct, cancellation, and day-of rules.">
                <Textarea id="rules" name="rules" rows={3} />
              </Field>
              <Field label="Vendor requirements" htmlFor="vendorRequirements" hint="Setup, staffing, signage, category, and operational expectations.">
                <Textarea id="vendorRequirements" name="vendorRequirements" rows={3} />
              </Field>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="insuranceRequired" className="size-4 accent-signal" />
                Current insurance required
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="permitRequired" className="size-4 accent-signal" />
                Permit or license required
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Who can see it" htmlFor="visibility">
                <Select id="visibility" name="visibility" defaultValue="public">
                  <option value="public">Public marketplace</option>
                  <option value="network">My vendor network</option>
                  <option value="invite_only">Invited vendors only</option>
                </Select>
              </Field>
              <Field label="Commerce type" htmlFor="commerceLayer">
                <Select id="commerceLayer" name="commerceLayer" defaultValue="">
                  <option value="">Any</option>
                  {COMMERCE_LAYER.map((layer) => (
                    <option key={layer} value={layer}>
                      {layer.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Expected attendance" htmlFor="estimatedAttendance">
                <Input id="estimatedAttendance" name="estimatedAttendance" type="number" min={0} placeholder="12000" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vendor categories" htmlFor="categoryTags" hint="Comma-separated: food, beverage, retail…">
                <Input id="categoryTags" name="categoryTags" placeholder="food, beverage" />
              </Field>
              <Field label="Audience profile" htmlFor="audienceProfile">
                <Input id="audienceProfile" name="audienceProfile" placeholder="Families, lunch crowd, weekend tourists" />
              </Field>
            </div>

            <Button type="submit" variant="signal" size="lg" className="justify-self-start">
              Save draft & add spaces
            </Button>
          </form>
        </PanelBody>
      </Panel>
    </div>
  );
}
