import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUserOrgContext } from "@/lib/auth-context";

const NAV_ITEMS = [
  ["Overview", "/dashboard"],
  ["Host ops", "/dashboard/host"],
  ["Venues", "/dashboard/host/venues"],
  ["Events", "/dashboard/host/events"],
  ["Opportunities", "/dashboard/host/opportunities"],
  ["Inventory units", "/dashboard/host/inventory-units"],
] as const;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authState = await auth();
  if (!authState.userId) redirect("/sign-in");
  const context = await getCurrentUserOrgContext();

  return (
    <div className="bs-shell">
      <aside className="bs-sidebar">
        <div className="bs-brand">
          <div className="bs-brand-mark">BS</div>
          <p className="bs-eyebrow">Host control plane</p>
          <h1>BidSpace</h1>
          <p className="bs-muted bs-small">{context?.activeOrganizationName ?? "No active organization"}</p>
        </div>
        <nav className="bs-nav" aria-label="Dashboard navigation">
          {NAV_ITEMS.map(([label, href]) => <Link key={href} href={href}>{label}<span>→</span></Link>)}
        </nav>
        <div className="bs-callout bs-small">
          <strong>Supply thesis</strong>
          <p className="bs-muted">Inventory Units are the sellable primitive. Opportunities package units; events remain optional.</p>
        </div>
        <div className="bs-sidebar-footer">
          <OrganizationSwitcher afterSelectOrganizationUrl="/dashboard" afterCreateOrganizationUrl="/onboarding" />
          <UserButton />
        </div>
      </aside>
      <main className="bs-content">
        <div className="bs-topbar">
          <div><p className="bs-eyebrow">Authenticated workspace</p><p className="bs-muted bs-small">Org role: {context?.activeOrganizationRole ?? "not linked"}</p></div>
          <div className="bs-auth-controls"><Link className="bs-button-secondary" href="/onboarding">Onboarding</Link></div>
        </div>
        {children}
      </main>
    </div>
  );
}
