import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  NotFoundError,
  assessFit,
  canSeeOpportunity,
  getOpportunityByRef,
  isActiveNetworkMember,
  isInvitedToOpportunity,
  listDocumentsForOrganization,
  listSavedOpportunityIds,
  listUnitsWithOpportunity,
  saveOpportunity,
  unsaveOpportunity,
  type PublicOpportunity,
} from "@bidspace/services";
import { formatMoney } from "@bidspace/core";
import type { InventoryUnitRow } from "@bidspace/db";
import {
  Badge,
  Button,
  DescriptionList,
  EmptyState,
  Icon,
  Panel,
  PanelBody,
  StatusBadge,
  buttonClasses,
} from "@bidspace/ui";
import { FitPanel } from "@/components/fit-panel";
import { getCurrentUserOrgContext } from "@/lib/auth-context";
import { tryGetDb } from "@/lib/safe-db";
import { describeDeadline, formatDateRange, formatDateTime } from "@/lib/format";
import { opportunityHref } from "@/components/opportunity-card";

export const dynamic = "force-dynamic";

const PRICING_EXPLANATION: Record<string, string> = {
  fixed: "Fixed price — the host set the terms; eligible vendors book directly.",
  minimum_bid: "Minimum bid — offers start at the listed floor; the host selects.",
  competitive_bid: "Competitive bid — qualified vendors submit sealed offers; the host selects.",
  hybrid: "Bid or book — bid from the floor price, or take a buy-now position where offered.",
};

async function loadOpportunity(slug: string): Promise<PublicOpportunity | null> {
  const db = tryGetDb();
  if (!db) return null;
  try {
    return await getOpportunityByRef(db, decodeURIComponent(slug));
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const opportunity = await loadOpportunity(slug);
  if (!opportunity) return { title: "Opportunity" };
  const place = opportunity.venue ? ` in ${opportunity.venue.city}, ${opportunity.venue.state}` : "";
  return {
    title: opportunity.title,
    description:
      opportunity.description?.slice(0, 160) ??
      `Temporary commercial opportunity${place} on BidSpace.`,
    openGraph: { title: opportunity.title, images: opportunity.image_urls?.[0] ? [opportunity.image_urls[0]] : undefined },
  };
}

function UnitCard({ unit }: { unit: InventoryUnitRow }) {
  const openForBids = ["available", "receiving_bids"].includes(unit.status);
  const specs = [
    unit.dimensions,
    unit.indoor === true ? "Indoor" : unit.indoor === false ? "Outdoor" : null,
    unit.power_available ? "Power" : null,
    unit.water_available ? "Water" : null,
    unit.vehicle_access ? "Vehicle access" : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col justify-between gap-3 rounded-[4px] border border-line bg-surface p-4 dark:bg-surface-dark sm:flex-row sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display font-semibold">{unit.name}</h3>
          <StatusBadge status={unit.status} />
        </div>
        <p className="mt-1 text-sm text-ink-muted dark:text-canvas-muted">
          {specs.length ? specs.join(" · ") : "Details on request"}
        </p>
        {unit.category_restrictions.length > 0 ? (
          <p className="mt-1 text-xs text-ink-muted dark:text-canvas-muted">
            Limited to: {unit.category_restrictions.join(", ")}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <p className="text-sm font-semibold tabular-nums">
          {unit.minimum_bid_cents != null ? `From ${formatMoney(unit.minimum_bid_cents)}` : "Open terms"}
          {unit.buy_now_price_cents != null ? (
            <span className="block text-xs font-normal text-ink-muted dark:text-canvas-muted">
              Buy now {formatMoney(unit.buy_now_price_cents)}
            </span>
          ) : null}
        </p>
        <Link
          href={`/units/${unit.id}`}
          className={buttonClasses(openForBids ? "signal" : "secondary", "sm")}
        >
          {openForBids ? "View & bid" : "View"}
        </Link>
      </div>
    </div>
  );
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = tryGetDb();
  const opportunity = await loadOpportunity(slug);
  if (!opportunity || !db) notFound();

  // Visibility: one canonical rule for public, network, invite-only supply.
  const viewer = await getCurrentUserOrgContext();
  const viewerOrgId = viewer?.activeDbOrganizationId ?? null;
  if (opportunity.visibility !== "public") {
    const [member, invited] = viewerOrgId
      ? await Promise.all([
          isActiveNetworkMember(db, opportunity.organization_id, viewerOrgId),
          isInvitedToOpportunity(db, opportunity.id, viewerOrgId),
        ])
      : [false, false];
    if (
      !canSeeOpportunity(opportunity, {
        viewerOrganizationId: viewerOrgId,
        isActiveNetworkMember: member,
        isInvited: invited,
      })
    ) {
      notFound();
    }
  }

  const units = await listUnitsWithOpportunity(db, opportunity.id);
  const start = opportunity.starts_at ?? opportunity.event?.starts_at ?? null;
  const end = opportunity.ends_at ?? opportunity.event?.ends_at ?? null;
  const deadline = describeDeadline(opportunity.bid_deadline);
  const heroImage = opportunity.image_urls?.[0] ?? opportunity.venue?.image_urls?.[0] ?? null;

  // Vendor-side context: saved state + explainable fit.
  const isVendorViewer = Boolean(
    viewer?.roleProfiles.some((p) => ["bidder", "sponsor", "service_provider"].includes(p.role_type)),
  );
  let saved = false;
  let fitReport = null;
  if (viewerOrgId && isVendorViewer) {
    const [savedIds, documents] = await Promise.all([
      listSavedOpportunityIds(db, viewerOrgId),
      listDocumentsForOrganization(db, viewerOrgId),
    ]);
    saved = savedIds.includes(opportunity.id);
    const vendorProfile = viewer!.roleProfiles.find((p) => p.role_type === "bidder");
    const profileTags = (vendorProfile as { category_tags?: string[] } | undefined)?.category_tags ?? [];
    fitReport = assessFit(
      {
        categoryTags: profileTags,
        verifiedDocumentTypes: documents
          .filter((d) => d.status === "verified")
          .map((d) => d.document_type),
      },
      opportunity,
      units[0] ?? null,
    );
  }

  async function toggleSave() {
    "use server";
    const context = await getCurrentUserOrgContext();
    const serverDb = tryGetDb();
    if (!context?.activeDbOrganizationId || !serverDb) return;
    const savedIds = await listSavedOpportunityIds(serverDb, context.activeDbOrganizationId);
    if (savedIds.includes(opportunity!.id)) {
      await unsaveOpportunity(serverDb, context.activeDbOrganizationId, opportunity!.id);
    } else {
      await saveOpportunity(serverDb, context.activeDbOrganizationId, opportunity!.id, context.dbUserId ?? undefined);
    }
    revalidatePath(opportunityHref(opportunity!));
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: opportunity.title,
    description: opportunity.description ?? undefined,
    startDate: start ?? undefined,
    endDate: end ?? undefined,
    location: opportunity.venue
      ? {
          "@type": "Place",
          name: opportunity.venue.name,
          address: { "@type": "PostalAddress", addressLocality: opportunity.venue.city, addressRegion: opportunity.venue.state },
        }
      : undefined,
    offers:
      opportunity.minimum_bid_cents != null
        ? {
            "@type": "Offer",
            price: (opportunity.minimum_bid_cents / 100).toFixed(2),
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          }
        : undefined,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-6 text-sm text-ink-muted dark:text-canvas-muted" aria-label="Breadcrumb">
        <Link href="/explore" className="hover:text-ink dark:hover:text-canvas">
          Explore
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink dark:text-canvas">{opportunity.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {/* THE OPPORTUNITY */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={opportunity.status} />
            {opportunity.visibility !== "public" ? (
              <Badge tone="neutral">
                {opportunity.visibility === "network" ? "Private network" : "Invitation only"}
              </Badge>
            ) : null}
            {opportunity.organization?.verification_status === "verified" ? (
              <Badge tone="positive">
                <Icon name="verified" size={12} weight="fill" /> Verified host
              </Badge>
            ) : null}
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {opportunity.title}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted dark:text-canvas-muted">
            {opportunity.venue ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="pin" size={15} />
                {opportunity.venue.name}, {opportunity.venue.city}, {opportunity.venue.state}
              </span>
            ) : null}
            {start && end ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="calendar" size={15} />
                {formatDateRange(start, end)}
              </span>
            ) : null}
            {opportunity.estimated_attendance ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="audience" size={15} />~
                {opportunity.estimated_attendance.toLocaleString()} expected attendance
              </span>
            ) : null}
          </p>

          {heroImage ? (
            <div className="relative mt-6 aspect-[16/7] overflow-hidden rounded-[4px] border border-line">
              <Image src={heroImage} alt="" fill sizes="(max-width:1024px) 100vw, 66vw" className="object-cover" />
            </div>
          ) : null}

          {opportunity.description ? (
            <p className="mt-6 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-ink-soft dark:text-canvas-soft">
              {opportunity.description}
            </p>
          ) : null}

          {/* THE SPACE(S) */}
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">
              Available positions{" "}
              <span className="text-base font-normal text-ink-muted dark:text-canvas-muted">
                ({units.length})
              </span>
            </h2>
            <div className="mt-4 grid gap-3">
              {units.length > 0 ? (
                units.map((unit) => <UnitCard key={unit.id} unit={unit} />)
              ) : (
                <EmptyState
                  icon="unit"
                  title="Positions are being finalized"
                  body="The host has not released individual inventory for this opportunity yet."
                />
              )}
            </div>
          </section>

          {/* REQUIREMENTS */}
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">Requirements &amp; context</h2>
            <DescriptionList
              className="mt-4"
              items={[
                {
                  term: "Commercial terms",
                  detail: PRICING_EXPLANATION[opportunity.pricing_mode],
                },
                {
                  term: "Audience",
                  detail: opportunity.audience_profile,
                },
                {
                  term: "Categories",
                  detail: opportunity.category_tags.length ? opportunity.category_tags.join(", ") : null,
                },
                {
                  term: "Submission deadline",
                  detail: opportunity.bid_deadline ? formatDateTime(opportunity.bid_deadline) : null,
                },
              ]}
            />
          </section>
        </div>

        {/* ACTION RAIL */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Panel>
            <PanelBody className="grid gap-4">
              <div>
                <p className="kicker mb-1">Commercial terms</p>
                <p className="font-display text-2xl font-semibold tabular-nums">
                  {opportunity.minimum_bid_cents != null
                    ? `From ${formatMoney(opportunity.minimum_bid_cents)}`
                    : "Open terms"}
                </p>
                {deadline ? (
                  <p className="mt-1 text-sm font-medium text-signal-deep dark:text-signal-bright">
                    {deadline}
                  </p>
                ) : null}
              </div>

              {units.length > 0 ? (
                <Link href={`/units/${units[0]!.id}`} className={buttonClasses("signal", "lg", "w-full")}>
                  <Icon name="bid" size={19} />
                  {units.length === 1 ? "View position & bid" : "Choose a position"}
                </Link>
              ) : null}

              {viewerOrgId && isVendorViewer ? (
                <form action={toggleSave}>
                  <Button type="submit" variant="secondary" size="md" className="w-full">
                    <Icon name="save" size={17} weight={saved ? "fill" : "regular"} />
                    {saved ? "Saved" : "Save for later"}
                  </Button>
                </form>
              ) : !viewerOrgId ? (
                <Link href="/sign-up" className={buttonClasses("secondary", "md", "w-full")}>
                  Sign up to apply or bid
                </Link>
              ) : null}

              <div className="border-t border-line pt-4 text-sm">
                <p className="kicker mb-2">Host</p>
                <p className="font-semibold">{opportunity.organization?.name ?? "Host organization"}</p>
                <p className="mt-1 text-ink-muted dark:text-canvas-muted">
                  {opportunity.organization?.verification_status === "verified"
                    ? "Identity and organization reviewed by BidSpace."
                    : "Verification in progress."}
                </p>
              </div>
            </PanelBody>
          </Panel>

          {fitReport ? <FitPanel report={fitReport} className="mt-4" /> : null}
        </aside>
      </div>
    </div>
  );
}
