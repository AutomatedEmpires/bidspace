import Link from "next/link";
import type { Metadata } from "next";
import {
  listInvitationsForVendor,
  listPublicOpportunities,
  listSavedOpportunityIds,
  getOpportunityByRef,
  NotFoundError,
} from "@bidspace/services";
import { EmptyState, Icon, PageHeader, Panel, PanelBody, StatusBadge, buttonClasses } from "@bidspace/ui";
import { OpportunityCard, opportunityHref } from "@/components/opportunity-card";
import { requireVendorContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";

export const metadata: Metadata = { title: "Discover" };
export const dynamic = "force-dynamic";

export default async function VendorDiscoverPage() {
  const context = await requireVendorContext();
  const db = tryGetDb();
  if (!db) {
    return (
      <EmptyState
        icon="warning"
        title="Marketplace data is not connected"
        body="The database environment variables are not configured for this deployment."
      />
    );
  }

  const [invitations, opportunities, savedIds] = await Promise.all([
    listInvitationsForVendor(db, context.activeDbOrganizationId),
    listPublicOpportunities(db, { limit: 24 }),
    listSavedOpportunityIds(db, context.activeDbOrganizationId),
  ]);

  const openInvitations = invitations.filter((i) => ["sent", "viewed"].includes(i.status));
  const invitedOpportunities = (
    await Promise.all(
      openInvitations.slice(0, 6).map(async (invitation) => {
        try {
          const opportunity = await getOpportunityByRef(db, invitation.opportunity_id);
          return { invitation, opportunity };
        } catch (error) {
          if (error instanceof NotFoundError) return null;
          throw error;
        }
      }),
    )
  ).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return (
    <div className="grid gap-10">
      <PageHeader
        kicker="Discover"
        title="Where should your business go next?"
        lede="Direct invitations first, then the open marketplace. Save what looks right, bid when you are ready."
        actions={
          <Link href="/map" className={buttonClasses("secondary", "md")}>
            <Icon name="map" size={18} />
            Map view
          </Link>
        }
      />

      {invitedOpportunities.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold">
            Invitations for {context.activeOrganizationName ?? "your business"}
          </h2>
          <p className="mt-1 text-sm text-ink-muted dark:text-canvas-muted">
            Hosts asked for you specifically. These close like any other opportunity — respond
            before the deadline.
          </p>
          <div className="mt-4 grid gap-3">
            {invitedOpportunities.map(({ invitation, opportunity }) => (
              <Panel key={invitation.id}>
                <PanelBody className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display font-semibold">{opportunity.title}</p>
                      <StatusBadge status={invitation.status} />
                    </div>
                    {invitation.message ? (
                      <p className="mt-1 text-sm text-ink-muted dark:text-canvas-muted">
                        “{invitation.message}”
                      </p>
                    ) : null}
                  </div>
                  <Link href={opportunityHref(opportunity)} className={buttonClasses("signal", "sm")}>
                    Review invitation
                  </Link>
                </PanelBody>
              </Panel>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-semibold">Open marketplace</h2>
          <Link
            href="/explore"
            className="text-sm font-semibold text-signal-deep hover:underline dark:text-signal-bright"
          >
            All filters
          </Link>
        </div>
        {opportunities.length > 0 ? (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {opportunities.map((opportunity) => (
              <div key={opportunity.id} className="relative">
                <OpportunityCard opportunity={opportunity} />
                {savedIds.includes(opportunity.id) ? (
                  <span className="absolute right-3 top-3 rounded-[3px] bg-surface/95 p-1 text-signal dark:bg-ink/90">
                    <Icon name="save" size={15} weight="fill" />
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            icon="opportunity"
            title="No public opportunities right now"
            body="Hosts release supply on their own schedule. Check back, or ask your regular organizers to invite you on BidSpace."
          />
        )}
      </section>
    </div>
  );
}
