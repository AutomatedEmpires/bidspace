import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserOrgContext } from "@/lib/auth-context";

export default async function DashboardPage() {
  const authState = await auth();
  if (!authState.userId) {
    redirect("/sign-in");
  }

  const context = await getCurrentUserOrgContext();
  const roles = new Set(context?.roleProfiles.map((profile) => profile.role_type) ?? []);

  return (
    <main className="dashboard-shell stack-lg">
      <header className="dashboard-header">
        <div className="stack">
          <p className="eyebrow">BidSpace command center</p>
          <h1>Dashboard</h1>
          <p className="muted">Move from discovery to sealed bid management, curated host selection, and booking-prep.</p>
        </div>
        <div className="action-row">
          <OrganizationSwitcher afterSelectOrganizationUrl="/dashboard" afterCreateOrganizationUrl="/onboarding" />
          <UserButton />
        </div>
      </header>

      <section className="card-grid">
        <Link className="card card-soft stack" href="/dashboard/bids">
          <p className="eyebrow">Bidder flow</p>
          <h2>My bids</h2>
          <p className="muted">Track your sealed bids, counters, host decisions, and payment-pending booking prep.</p>
          <span className="badge">{roles.has("bidder") ? "Bidder role active" : "Bidder role needed"}</span>
        </Link>
        <Link className="card card-soft stack" href="/dashboard/host/bids">
          <p className="eyebrow">Host flow</p>
          <h2>Incoming bids</h2>
          <p className="muted">View, shortlist, counter, accept, waitlist, reject, and request payment without live Stripe execution.</p>
          <span className="badge">{roles.has("host") ? "Host role active" : "Host role needed"}</span>
        </Link>
      </section>

      <section className="card stack">
        <h2>Active organization</h2>
        <p>Clerk org: {context?.activeClerkOrganizationId ?? "none"}</p>
        <p>BidSpace org: {context?.activeDbOrganizationId ?? "not yet linked"}</p>
        <p>Name: {context?.activeOrganizationName ?? "none"}</p>
        <p>Membership role: {context?.activeOrganizationRole ?? "none"}</p>
      </section>

      <section className="card stack">
        <h2>Marketplace role profiles</h2>
        {context?.roleProfiles.length ? (
          <ul className="stack">
            {context.roleProfiles.map((profile) => (
              <li key={profile.id}>
                {profile.role_type}: {profile.display_name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No role profiles found for this organization yet. Visit onboarding to add one.</p>
        )}
      </section>
    </main>
  );
}
