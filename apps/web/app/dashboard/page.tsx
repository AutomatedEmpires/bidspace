import Link from "next/link";
import { getCurrentUserOrgContext } from "@/lib/auth-context";
import { getHostWorkspaceContext } from "@/lib/host-access";
import { getHostSupplySnapshot, pretty } from "@/lib/host-supply";

export default async function DashboardPage() {
  const context = await getCurrentUserOrgContext();
  const hostContext = await getHostWorkspaceContext();
  const snapshot = hostContext ? await getHostSupplySnapshot(hostContext.organizationId) : null;

  return (
    <div className="bs-stack">
      <section className="bs-hero">
        <p className="bs-eyebrow">Operations dashboard</p>
        <h2>Turn real-world space into managed, biddable supply.</h2>
        <p>This workspace tracks the host supply spine end-to-end: venues, optional events, opportunities, and the Inventory Units bidders actually compete for.</p>
        <div className="bs-pills">
          <span className="bs-pill">Org: {context?.activeOrganizationName ?? "not selected"}</span>
          <span className="bs-pill">BidSpace org: {context?.activeDbOrganizationId ?? "not linked"}</span>
          <span className="bs-pill">Role: {context?.activeOrganizationRole ?? "none"}</span>
        </div>
      </section>
      {hostContext && snapshot ? (
        <>
          <section className="bs-grid bs-grid-4">
            <Stat label="Venues" value={snapshot.venues.length} />
            <Stat label="Events" value={snapshot.events.length} />
            <Stat label="Opportunities" value={snapshot.opportunities.length} />
            <Stat label="Inventory units" value={snapshot.inventoryUnits.length} />
          </section>
          <section className="bs-grid bs-grid-2">
            <div className="bs-card bs-stack">
              <div className="bs-row"><div><p className="bs-eyebrow">Host ops</p><h3>Supply command center</h3></div><Link className="bs-button" href="/dashboard/host">Open</Link></div>
              <p className="bs-muted">Manage lifecycle status, relationship mapping, and creation/edit workflows from one host surface.</p>
            </div>
            <div className="bs-card bs-stack">
              <p className="bs-eyebrow">Role profiles</p>
              {context?.roleProfiles.length ? <div className="bs-pills">{context.roleProfiles.map((profile) => <span className="bs-pill" key={profile.id}>{pretty(profile.role_type)}</span>)}</div> : <p className="bs-muted">No marketplace role profiles found.</p>}
            </div>
          </section>
        </>
      ) : (
        <section className="bs-card bs-stack">
          <h3>Host workspace locked</h3>
          <p className="bs-muted">Choose an organization and complete onboarding with a host, venue owner, or network operator role before managing supply.</p>
          <Link className="bs-button" href="/onboarding">Complete onboarding</Link>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="bs-card bs-stat"><span className="bs-eyebrow">{label}</span><strong>{value}</strong></div>;
}
