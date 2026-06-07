import "server-only";
import { redirect } from "next/navigation";
import type { MarketplaceRoleType, OrganizationMemberRole } from "@bidspace/core";
import { createServerBidspaceClient } from "./bidspace-server";
import { getCurrentUserOrgContext } from "./auth-context";
import { hasOrgRole } from "./permissions";

const HOST_CAPABLE_ROLES: readonly MarketplaceRoleType[] = ["host", "venue_owner", "network_operator"];

export interface HostWorkspaceContext {
  clerkUserId: string;
  dbUserId: string;
  organizationId: string;
  organizationName: string;
  organizationRole: OrganizationMemberRole;
  roleProfiles: NonNullable<Awaited<ReturnType<typeof getCurrentUserOrgContext>>>["roleProfiles"];
}

export async function getHostWorkspaceContext(): Promise<HostWorkspaceContext | null> {
  const context = await getCurrentUserOrgContext();
  if (!context?.dbUserId || !context.activeDbOrganizationId || !context.activeOrganizationRole) return null;
  const hasHostProfile = context.roleProfiles.some((profile) =>
    HOST_CAPABLE_ROLES.includes(profile.role_type as MarketplaceRoleType),
  );
  if (!hasHostProfile || !hasOrgRole("member", context.activeOrganizationRole)) return null;
  return {
    clerkUserId: context.clerkUserId,
    dbUserId: context.dbUserId,
    organizationId: context.activeDbOrganizationId,
    organizationName: context.activeOrganizationName ?? "Active organization",
    organizationRole: context.activeOrganizationRole,
    roleProfiles: context.roleProfiles,
  };
}

export async function requireHostWorkspaceContext(): Promise<HostWorkspaceContext> {
  const context = await getHostWorkspaceContext();
  if (!context) redirect("/onboarding?error=host_required");
  return context;
}

export function hostDb() {
  return createServerBidspaceClient();
}
