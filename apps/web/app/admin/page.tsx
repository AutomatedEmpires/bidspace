import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { EmptyState, PlatformShell, StatusPill } from "../_components/platform-shell";
import { formatDate, getPlatformData, humanize, statusPresentation, text } from "@/lib/platform-data";

export default async function AdminPage() {
  const authState = await auth();
  if (!authState.userId) redirect("/sign-in");

  const data = await getPlatformData();
  const inventoryAtRisk = data.inventoryUnits.filter((unit) => text(unit.status) === "draft" || text(unit.status) === "archived").length;
  const blockedTrust = data.verifications.filter((verification) => ["rejected", "expired", "revoked"].includes(text(verification.status))).length;

  return (
    <PlatformShell
      active="/admin"
      title="Marketplace oversight"
      description="Operator-facing queue for trust, inventory readiness, sealed-bid oversight, and organization health."
    >
      {!data.canManageTrust ? (
        <EmptyState title="Read-only operator view">
          Owner, admin, or manager access is required to take action. This page still explains marketplace state for review and escalation.
        </EmptyState>
      ) : null}

      <section className="metric-grid">
        <article className="metric-card"><span>Verification queue</span><strong>{data.verifications.length}</strong><p>{blockedTrust} blocked or stale trust check(s).</p></article>
        <article className="metric-card"><span>Admin actions</span><strong>{data.adminActions.length}</strong><p>Operator interventions recorded against this organization.</p></article>
        <article className="metric-card"><span>Inventory at risk</span><strong>{inventoryAtRisk}</strong><p>Draft or archived units that should not be treated as live supply.</p></article>
        <article className="metric-card"><span>Sealed bids</span><strong>{data.hostBids.length + data.bidderBids.length}</strong><p>Host-visible plus bidder-owned bid records.</p></article>
      </section>

      <section className="section-grid two-column">
        <article className="panel-card">
          <div className="panel-heading"><div><p className="eyebrow">Trust ops</p><h2>Verification workload</h2></div></div>
          {data.verifications.length ? (
            <div className="card-list">
              {data.verifications.slice(0, 6).map((verification) => (
                <article className="mini-card" key={text(verification.id)}>
                  <div>
                    <h3>{humanize(verification.verification_type)}</h3>
                    <p>{text(verification.notes) || `${humanize(verification.subject_type)} evidence review`}</p>
                    <small>Updated {formatDate(verification.updated_at)}</small>
                  </div>
                  <StatusPill tone={statusPresentation(verification.status).tone}>{statusPresentation(verification.status).label}</StatusPill>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No verification workload">Pending verification requests will appear here for internal review.</EmptyState>
          )}
        </article>

        <article className="panel-card">
          <div className="panel-heading"><div><p className="eyebrow">Marketplace health</p><h2>Supply and demand checks</h2></div></div>
          <ul className="stack-list">
            <li><span>Venues</span><strong>{data.venues.length}</strong></li>
            <li><span>Opportunities</span><strong>{data.opportunities.length}</strong></li>
            <li><span>Inventory units</span><strong>{data.inventoryUnits.length}</strong></li>
            <li><span>Bookings</span><strong>{data.bookings.length}</strong></li>
          </ul>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-heading"><div><p className="eyebrow">Oversight ledger</p><h2>Admin actions</h2></div></div>
        {data.adminActions.length ? (
          <div className="table-card">
            <table>
              <thead><tr><th>Action</th><th>Target</th><th>Notes</th><th>Created</th></tr></thead>
              <tbody>
                {data.adminActions.map((action) => (
                  <tr key={text(action.id)}>
                    <td>{humanize(action.action_type)}</td>
                    <td>{humanize(action.target_type)}</td>
                    <td>{text(action.notes) || "—"}</td>
                    <td>{formatDate(action.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No admin actions recorded">Suspensions, hidden listings, verification decisions, disputes, and flags will create the operational audit trail here.</EmptyState>
        )}
      </section>
    </PlatformShell>
  );
}
