import { OrganizationList } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { MARKETPLACE_ROLE_TYPE } from "@bidspace/core";
import Link from "next/link";

const DEFAULT_ORG_NAME = "BidSpace Organization";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const authState = await auth();
  const params = await searchParams;
  const rolesRequired = params.error === "roles_required";

  if (!authState.orgId) {
    return (
      <main style={{ padding: 24, fontFamily: "sans-serif" }}>
        <h1>Create or join your organization</h1>
        <p>Select an organization context before setting marketplace roles.</p>
        <OrganizationList
          hidePersonal
          afterCreateOrganizationUrl="/onboarding"
          afterSelectOrganizationUrl="/onboarding"
        />
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Marketplace role onboarding</h1>
      <p>Pick one or more marketplace roles for your active organization profile.</p>
      {rolesRequired ? <p style={{ color: "#b91c1c" }}>Select at least one role.</p> : null}
      <form action="/onboarding/complete" method="post">
        <input type="hidden" name="organizationName" value={DEFAULT_ORG_NAME} />
        <fieldset style={{ border: "1px solid #ddd", padding: 16, marginBottom: 16 }}>
          <legend>Role profiles</legend>
          {MARKETPLACE_ROLE_TYPE.map((role) => (
            <label key={role} style={{ display: "block", marginBottom: 8 }}>
              <input type="checkbox" name="roles" value={role} /> {role}
            </label>
          ))}
        </fieldset>
        <button type="submit">Complete onboarding</button>
      </form>
      <p style={{ marginTop: 16 }}>
        <Link href="/dashboard">Skip to dashboard</Link>
      </p>
    </main>
  );
}
