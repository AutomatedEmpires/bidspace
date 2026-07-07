import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  aggregateReviews,
  buildTrustSignals,
  listDocumentsForOrganization,
  listPublicOpportunities,
  listReviewsForOrganization,
} from "@bidspace/services";
import type { OrganizationRow, VenueRow } from "@bidspace/db";
import { Badge, EmptyState, Icon, PageHeader, Panel, PanelBody, PanelHeader } from "@bidspace/ui";
import { OpportunityCard } from "@/components/opportunity-card";
import { tryGetDb } from "@/lib/safe-db";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveHostOrg(slug: string): Promise<OrganizationRow | null> {
  const db = tryGetDb();
  if (!db) return null;
  const decoded = decodeURIComponent(slug);
  if (UUID.test(decoded)) {
    return ((await db.from("organizations").select("*").eq("id", decoded).maybeSingle()).data ??
      null) as OrganizationRow | null;
  }
  const profile = (
    await db
      .from("role_profiles")
      .select("organization_id")
      .eq("slug", decoded)
      .in("role_type", ["host", "venue_owner", "network_operator"])
      .maybeSingle()
  ).data as { organization_id: string } | null;
  if (!profile) return null;
  return ((
    await db.from("organizations").select("*").eq("id", profile.organization_id).maybeSingle()
  ).data ?? null) as OrganizationRow | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await resolveHostOrg(slug);
  return {
    title: org ? `${org.name} — host` : "Host",
    description: org?.description?.slice(0, 160) ?? "A host organization on BidSpace.",
  };
}

export default async function HostProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = tryGetDb();
  const organization = await resolveHostOrg(slug);
  if (!organization || !db) notFound();

  const [opportunitiesAll, venues, reviews, documents] = await Promise.all([
    listPublicOpportunities(db, { limit: 60 }),
    db.from("venues").select("*").eq("organization_id", organization.id).eq("status", "active"),
    listReviewsForOrganization(db, organization.id),
    listDocumentsForOrganization(db, organization.id),
  ]);
  const opportunities = opportunitiesAll.filter((o) => o.organization_id === organization.id);
  const completedBookings = (
    await db
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("host_organization_id", organization.id)
      .in("status", ["completed", "reviewed"])
  ).count ?? 0;

  const trust = buildTrustSignals({
    organization,
    completedBookings,
    reviewCount: reviews.length,
    currentDocuments: documents,
  });
  const ratings = aggregateReviews(reviews);
  const hostVenues = (venues.data ?? []) as VenueRow[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        kicker="Host"
        title={organization.name}
        lede={organization.description ?? undefined}
        actions={
          organization.verification_status === "verified" ? (
            <Badge tone="positive">
              <Icon name="verified" size={12} weight="fill" /> Verified host
            </Badge>
          ) : undefined
        }
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-10">
          <section>
            <h2 className="font-display text-xl font-semibold">
              Open opportunities ({opportunities.length})
            </h2>
            {opportunities.length > 0 ? (
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                {opportunities.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            ) : (
              <EmptyState
                className="mt-4"
                icon="opportunity"
                title="Nothing open right now"
                body="This host releases inventory around their event calendar. Check back, or sign in and save the host's next release."
              />
            )}
          </section>

          {hostVenues.length > 0 ? (
            <section>
              <h2 className="font-display text-xl font-semibold">Locations</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {hostVenues.map((venue) => (
                  <Panel key={venue.id}>
                    <PanelBody>
                      <p className="font-display font-semibold">{venue.name}</p>
                      <p className="mt-0.5 text-sm text-ink-muted dark:text-canvas-muted">
                        {venue.city}, {venue.state} · {venue.venue_type.replace(/_/g, " ")}
                      </p>
                      {venue.description ? (
                        <p className="mt-2 line-clamp-3 text-sm text-ink-soft dark:text-canvas-soft">
                          {venue.description}
                        </p>
                      ) : null}
                    </PanelBody>
                  </Panel>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="grid content-start gap-4">
          <Panel>
            <PanelHeader title="Why trust this host" kicker="Provenance, not a badge" />
            <PanelBody>
              <ul className="grid gap-3">
                {trust.map((signal) => (
                  <li key={signal.key} className="flex items-start gap-2.5">
                    <Icon
                      name={signal.earned ? "verified" : "pending"}
                      size={17}
                      weight={signal.earned ? "fill" : "regular"}
                      className={
                        signal.earned
                          ? "mt-0.5 shrink-0 text-moss dark:text-moss-bright"
                          : "mt-0.5 shrink-0 text-ink-faint dark:text-canvas-faint"
                      }
                    />
                    <span>
                      <span className="block text-sm font-semibold">{signal.label}</span>
                      <span className="block text-xs text-ink-muted dark:text-canvas-muted">{signal.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>

          {ratings.count > 0 ? (
            <Panel>
              <PanelBody>
                <p className="kicker mb-1">Vendor reviews</p>
                <p className="font-display text-3xl font-semibold tabular-nums">
                  {ratings.averageRating}
                  <span className="text-lg font-normal text-ink-muted dark:text-canvas-muted"> / 5</span>
                </p>
                <p className="mt-1 text-xs text-ink-muted dark:text-canvas-muted">
                  {ratings.count} review{ratings.count === 1 ? "" : "s"} from completed bookings
                  {ratings.wouldBookAgainRate != null ? ` · ${ratings.wouldBookAgainRate}% would book again` : ""}
                </p>
              </PanelBody>
            </Panel>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
