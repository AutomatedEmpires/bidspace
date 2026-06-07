import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, PlatformShell, StatusPill } from "../_components/platform-shell";
import { formatMoney, getPlatformData, humanize, statusPresentation, text } from "@/lib/platform-data";

export default async function DashboardPage() {
  const authState = await auth();
  if (!authState.userId) {
    redirect("/sign-in");
  }

  const data = await getPlatformData();
  const activeRoles = data.roleProfiles.map((profile) => text(profile.role_type));
  const isHost = activeRoles.some((role) => role === "host" || role === "venue_owner" || role === "network_operator");
  const isBidder = activeRoles.some((role) => role === "bidder" || role === "sponsor" || role === "service_provider");

  return (
    <PlatformShell
      active="/dashboard"
      title="Marketplace command center"
      description="Role-aware operating view for bids, inventory, bookings, reputation, and trust readiness."
    >
      {!data.organization ? (
        <EmptyState title="Choose or onboard an organization">
          BidSpace objects are owned by organizations. Select a Clerk organization or finish onboarding before operating marketplace workflows.
        </EmptyState>
      ) : null}

      <section className="hero-card">
        <div>
          <p className="eyebrow">Active organization</p>
          <h2>{text(data.organization?.name) || data.context?.activeOrganizationName || "No organization linked"}</h2>
          <p>{text(data.organization?.description) || "Complete the trust profile so hosts and bidders understand who they are working with."}</p>
        </div>
        <div className="trust-score-card">
          <StatusPill tone={data.trustLevel.tone}>{data.trustLevel.label}</StatusPill>
          <strong>{data.trustLevel.score}/100</strong>
          <span>Marketplace trust score</span>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <span>Role profiles</span>
          <strong>{data.roleProfiles.length}</strong>
          <p>{activeRoles.length ? activeRoles.map(humanize).join(" · ") : "No active marketplace role profile yet."}</p>
        </article>
        <article className="metric-card">
          <span>Host pipeline</span>
          <strong>{data.hostBids.length}</strong>
          <p>{isHost ? "Bids requiring host curation or follow-up." : "Add a host or venue-owner role to activate host operations."}</p>
        </article>
        <article className="metric-card">
          <span>Bidder activity</span>
          <strong>{data.bidderBids.length}</strong>
          <p>{isBidder ? "Sealed bids submitted from this organization." : "Add a bidder, sponsor, or service role to activate bidder operations."}</p>
        </article>
        <article className="metric-card">
          <span>Reputation</span>
          <strong>{data.reviewStats.averageRating ? data.reviewStats.averageRating.toFixed(1) : "—"}</strong>
          <p>{data.reviewStats.count} review(s) received.</p>
        </article>
      </section>

      <section className="section-grid two-column">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Trust posture</p>
              <h2>Verification readiness</h2>
            </div>
            <Link href="/trust">Open trust center</Link>
          </div>
          <ul className="stack-list">
            <li>
              <span>Organization status</span>
              <StatusPill tone={statusPresentation(data.organization?.status).tone}>{statusPresentation(data.organization?.status).label}</StatusPill>
            </li>
            <li>
              <span>Organization verification</span>
              <StatusPill tone={statusPresentation(data.organization?.verification_status).tone}>{statusPresentation(data.organization?.verification_status).label}</StatusPill>
            </li>
            <li>
              <span>Evidence documents</span>
              <strong>{data.documents.length}</strong>
            </li>
            <li>
              <span>Open verification records</span>
              <strong>{data.verifications.length}</strong>
            </li>
          </ul>
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Product segmentation</p>
              <h2>Role-aware next actions</h2>
            </div>
          </div>
          <div className="role-action-grid">
            <div>
              <h3>Host / venue operator</h3>
              <p>{isHost ? `${data.opportunities.length} opportunities and ${data.inventoryUnits.length} inventory units are in scope.` : "Not active for this org yet."}</p>
            </div>
            <div>
              <h3>Bidder / sponsor</h3>
              <p>{isBidder ? `${formatMoney(data.bidderBids[0]?.amount_cents)} latest sealed bid amount visible only to this bidder org.` : "Not active for this org yet."}</p>
            </div>
            <div>
              <h3>Operator</h3>
              <p>{data.canManageTrust ? "Can access trust/admin workflows for this organization." : "Viewer/member access: operational controls are read-only."}</p>
            </div>
          </div>
        </article>
      </section>
    </PlatformShell>
  );
}
