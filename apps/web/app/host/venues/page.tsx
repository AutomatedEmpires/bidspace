import Link from "next/link";
import type { Metadata } from "next";
import { listVenuesForOrg } from "@bidspace/services";
import { EmptyState, Icon, PageHeader, Panel, PanelBody, StatusBadge, buttonClasses } from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";

export const metadata: Metadata = { title: "Locations" };
export const dynamic = "force-dynamic";

export default async function HostVenuesPage() {
  const context = await requireHostContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const venues = await listVenuesForOrg(db, context.activeDbOrganizationId);

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Locations"
        title="The places you control"
        lede="A location persists; its inventory gets released again and again. Define it once, properly."
        actions={
          <Link href="/host/venues/new" className={buttonClasses("signal", "md")}>
            <Icon name="add" size={17} />
            Add location
          </Link>
        }
      />

      {venues.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {venues.map((venue) => (
            <Panel key={venue.id}>
              <PanelBody className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg font-semibold">{venue.name}</h2>
                    <p className="text-sm text-ink-muted dark:text-canvas-muted">
                      {venue.address_line_1}, {venue.city}, {venue.state}
                    </p>
                  </div>
                  <StatusBadge status={venue.status} />
                </div>
                <p className="text-sm text-ink-muted dark:text-canvas-muted">
                  {[
                    venue.venue_type.replace(/_/g, " "),
                    venue.capacity ? `capacity ~${venue.capacity.toLocaleString()}` : null,
                    venue.power_available ? "power" : null,
                    venue.water_available ? "water" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-auto flex gap-2 pt-2">
                  <Link href={`/host/venues/${venue.id}`} className={buttonClasses("secondary", "sm")}>
                    Manage
                  </Link>
                  <Link
                    href={`/host/opportunities/new?venueId=${venue.id}`}
                    className={buttonClasses("ghost", "sm")}
                  >
                    Release inventory here
                  </Link>
                </div>
              </PanelBody>
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="venue"
          title="Create your first commercial space"
          body="Add one location, define what can be booked, and publish when you are ready. Everything else builds on this."
          actions={
            <Link href="/host/venues/new" className={buttonClasses("signal", "sm")}>
              Add your first location
            </Link>
          }
        />
      )}
    </div>
  );
}
