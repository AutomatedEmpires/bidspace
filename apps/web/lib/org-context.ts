import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUserOrgContext } from "./auth-context";

export type OrgContext = NonNullable<Awaited<ReturnType<typeof getCurrentUserOrgContext>>>;

export interface ActiveOrgContext extends OrgContext {
  activeClerkOrganizationId: string;
  activeDbOrganizationId: string;
}

// A signed-in user with a linked BidSpace organization; otherwise route them
// to the step they actually need (sign-in or onboarding), never a dead end.
export async function requireActiveOrgContext(): Promise<ActiveOrgContext> {
  const context = await getCurrentUserOrgContext();
  if (!context) {
    redirect("/sign-in");
  }
  if (!context.activeClerkOrganizationId || !context.activeDbOrganizationId) {
    redirect("/onboarding");
  }
  return context as ActiveOrgContext;
}

export function hasRoleProfile(
  context: Pick<OrgContext, "roleProfiles">,
  roleType: string,
): boolean {
  return context.roleProfiles.some((profile) => profile.role_type === roleType);
}

// Host-side = controls supply. Vendor-side = pursues opportunities.
export function isHostSide(context: Pick<OrgContext, "roleProfiles">): boolean {
  return context.roleProfiles.some((p) =>
    ["host", "venue_owner", "network_operator"].includes(p.role_type),
  );
}

export function isVendorSide(context: Pick<OrgContext, "roleProfiles">): boolean {
  return context.roleProfiles.some((p) =>
    ["bidder", "sponsor", "service_provider"].includes(p.role_type),
  );
}

export async function requireHostContext(): Promise<ActiveOrgContext> {
  const context = await requireActiveOrgContext();
  if (!isHostSide(context)) {
    redirect("/onboarding?error=host_role_required");
  }
  return context;
}

export async function requireVendorContext(): Promise<ActiveOrgContext> {
  const context = await requireActiveOrgContext();
  if (!isVendorSide(context)) {
    redirect("/onboarding?error=vendor_role_required");
  }
  return context;
}
