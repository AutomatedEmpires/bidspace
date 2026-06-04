import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUserOrgContext } from "@/lib/auth-context";

export default async function DashboardPage() {
  const authState = await auth();
  if (!authState.userId) {
    redirect("/sign-in");
  }

  const context = await getCurrentUserOrgContext();

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Dashboard</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <OrganizationSwitcher afterSelectOrganizationUrl="/dashboard" afterCreateOrganizationUrl="/onboarding" />
          <UserButton />
        </div>
      </header>

      <section style={{ marginBottom: 16 }}>
        <h2>Active organization</h2>
        <p>Clerk org: {context?.activeClerkOrganizationId ?? "none"}</p>
        <p>BidSpace org: {context?.activeDbOrganizationId ?? "not yet linked"}</p>
        <p>Name: {context?.activeOrganizationName ?? "none"}</p>
        <p>Membership role: {context?.activeOrganizationRole ?? "none"}</p>
      </section>

      <section>
        <h2>Marketplace role profiles</h2>
        {context?.roleProfiles.length ? (
          <ul>
            {context.roleProfiles.map((profile) => (
              <li key={profile.id}>
                {profile.role_type}: {profile.display_name}
              </li>
            ))}
          </ul>
        ) : (
          <p>No role profiles found for this organization yet. Visit onboarding to add one.</p>
        )}
      </section>
    </main>
  );
}
