import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  aggregateReviews,
  buildTrustSignals,
  listDocumentsForOrganization,
  listReviewsForOrganization,
} from "@bidspace/services";
import type { OrganizationRow, RoleProfileRow } from "@bidspace/db";
import { Badge, Icon, PageHeader, Panel, PanelBody, PanelHeader } from "@bidspace/ui";
import { tryGetDb } from "@/lib/safe-db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveVendorProfile(
  slug: string,
): Promise<{ profile: RoleProfileRow; organization: OrganizationRow } | null> {
  const db = tryGetDb();
  if (!db) return null;
  const decoded = decodeURIComponent(slug);
  const profileQuery = db
    .from("role_profiles")
    .select("*")
    .in("role_type", ["bidder", "sponsor", "service_provider"]);
  const profile = (UUID.test(decoded)
    ? (await profileQuery.eq("organization_id", decoded).limit(1).maybeSingle()).data
    : (await profileQuery.eq("slug", decoded).maybeSingle()).data) as RoleProfileRow | null;
  if (!profile || profile.status === "hidden" || profile.status === "archived") return null;
  const organization = (
    await db.from("organizations").select("*").eq("id", profile.organization_id).maybeSingle()
  ).data as OrganizationRow | null;
  if (!organization) return null;
  return { profile, organization };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveVendorProfile(slug);
  return {
    title: resolved ? `${resolved.profile.display_name} — vendor` : "Vendor",
    description: resolved?.profile.bio?.slice(0, 160) ?? "A vendor on BidSpace.",
  };
}

export default async function VendorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = tryGetDb();
  const resolved = await resolveVendorProfile(slug);
  if (!resolved || !db) notFound();
  const { profile, organization } = resolved;

  const [reviews, documents] = await Promise.all([
    listReviewsForOrganization(db, organization.id),
    listDocumentsForOrganization(db, organization.id),
  ]);
  const completedBookings = (
    await db
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("bidder_organization_id", organization.id)
      .in("status", ["completed", "reviewed"])
  ).count ?? 0;

  const ratings = aggregateReviews(reviews);
  const details = profile.profile_details ?? {};
  const trust = buildTrustSignals({
    organization,
    completedBookings,
    reviewCount: reviews.length,
    currentDocuments: documents,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        kicker="Vendor"
        title={profile.display_name}
        lede={profile.bio ?? undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {organization.verification_status === "verified" ? (
              <Badge tone="positive">
                <Icon name="verified" size={12} weight="fill" /> Verified business
              </Badge>
            ) : null}
            {profile.category_tags.slice(0, 4).map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        }
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-10">
          {(details.pitchToHosts || details.setupType || details.spaceNeeds) ? (
            <section>
              <h2 className="font-display text-xl font-semibold">A fit for your space</h2>
              {details.pitchToHosts ? (
                <p className="mt-3 max-w-3xl text-[15px] leading-relaxed">{details.pitchToHosts}</p>
              ) : null}
              <dl className="mt-5 grid gap-4 rounded-[4px] border border-line bg-surface p-5 text-sm dark:bg-surface-dark sm:grid-cols-2">
                {details.setupType ? <div><dt className="kicker mb-1">Setup</dt><dd>{details.setupType}</dd></div> : null}
                {details.spaceNeeds ? <div><dt className="kicker mb-1">Space needs</dt><dd>{details.spaceNeeds}</dd></div> : null}
                {details.powerNeeds ? <div><dt className="kicker mb-1">Power</dt><dd>{details.powerNeeds}</dd></div> : null}
                {details.waterNeeds ? <div><dt className="kicker mb-1">Water</dt><dd>{details.waterNeeds}</dd></div> : null}
                {details.serviceArea ? <div><dt className="kicker mb-1">Service area</dt><dd>{details.serviceArea}</dd></div> : null}
                {details.availability ? <div><dt className="kicker mb-1">Availability</dt><dd>{details.availability}</dd></div> : null}
              </dl>
            </section>
          ) : null}
          {profile.gallery_urls.length > 0 ? (
            <section>
              <h2 className="font-display text-xl font-semibold">Portfolio</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {profile.gallery_urls.slice(0, 12).map((url) => (
                  <div key={url} className="relative aspect-square overflow-hidden rounded-[4px] border border-line">
                    <Image src={url} alt={`${profile.display_name} portfolio image`} fill sizes="300px" className="object-cover" />
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="plan-grid rounded-[4px] border border-dashed border-strong p-10 text-center">
              <Icon name="photo" size={28} className="mx-auto text-ink-faint dark:text-canvas-faint" />
              <p className="mt-3 text-sm text-ink-muted dark:text-canvas-muted">
                No portfolio images yet.
              </p>
            </section>
          )}

          {reviews.length > 0 ? (
            <section>
              <h2 className="font-display text-xl font-semibold">Host reviews</h2>
              <div className="mt-4 grid gap-3">
                {reviews.slice(0, 6).map((review) => (
                  <Panel key={review.id}>
                    <PanelBody>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold tabular-nums">{Number(review.rating)}/5</p>
                        <p className="text-xs text-ink-muted dark:text-canvas-muted">
                          {formatDate(review.created_at)}
                          {review.would_book_again ? " · would book again" : ""}
                        </p>
                      </div>
                      {review.written_feedback ? (
                        <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-canvas-soft">
                          {review.written_feedback}
                        </p>
                      ) : null}
                    </PanelBody>
                  </Panel>
                ))}
              </div>
            </section>
          ) : null}

          {details.priorEvents?.length ? (
            <section>
              <h2 className="font-display text-xl font-semibold">Prior events &amp; placements</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {details.priorEvents.map((eventName) => (
                  <li key={eventName} className="flex items-center gap-2 rounded-[3px] border border-line px-3 py-2 text-sm">
                    <Icon name="event" size={15} className="text-ink-muted" /> {eventName}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="grid content-start gap-4">
          {ratings.count > 0 ? (
            <Panel>
              <PanelBody>
                <p className="kicker mb-1">Marketplace record</p>
                <p className="font-display text-3xl font-semibold tabular-nums">
                  {ratings.averageRating}
                  <span className="text-lg font-normal text-ink-muted dark:text-canvas-muted"> / 5</span>
                </p>
                <p className="mt-1 text-xs text-ink-muted dark:text-canvas-muted">
                  {completedBookings} completed booking{completedBookings === 1 ? "" : "s"} ·{" "}
                  {ratings.count} review{ratings.count === 1 ? "" : "s"}
                </p>
              </PanelBody>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader title="Trust provenance" kicker="Why hosts can rely on them" />
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

          {profile.service_radius_miles ? (
            <Panel>
              <PanelBody className="text-sm">
                <p className="kicker mb-1">Operating range</p>
                <p className="flex items-center gap-2">
                  <Icon name="pin" size={15} />
                  Travels up to {profile.service_radius_miles} miles
                </p>
              </PanelBody>
            </Panel>
          ) : null}
          {details.socialLinks?.length ? (
            <Panel>
              <PanelHeader title="Links" kicker="Vendor-provided" />
              <PanelBody className="grid gap-2 text-sm">
                {details.socialLinks.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-plan hover:underline dark:text-plan-bright">
                    <Icon name="external" size={14} /> {new URL(url).hostname}
                  </a>
                ))}
              </PanelBody>
            </Panel>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
