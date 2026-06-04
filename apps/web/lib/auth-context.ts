import "server-only";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { createServerBidspaceClient } from "./bidspace-server";
import { normalizeMembershipRole } from "./permissions";

interface SignedInUserContext {
  authState: Awaited<ReturnType<typeof auth>>;
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>;
}

export async function requireSignedInUser(): Promise<SignedInUserContext | null> {
  const authState = await auth();
  if (!authState.userId) {
    return null;
  }

  const user = await currentUser();
  if (!user) {
    return null;
  }

  return {
    authState,
    user,
  };
}

export async function getCurrentUserOrgContext() {
  const signedIn = await requireSignedInUser();
  if (!signedIn) {
    return null;
  }

  const { authState, user } = signedIn;
  const clerk = await clerkClient();

  const org = authState.orgId ? await clerk.organizations.getOrganization({ organizationId: authState.orgId }) : null;
  const dbOrganizationId = typeof org?.publicMetadata?.bidspaceOrganizationId === "string" ? org.publicMetadata.bidspaceOrganizationId : null;

  const db = createServerBidspaceClient();
  const { data: dbUser } = await db.from("users").select("id").eq("auth_provider_id", user.id).maybeSingle();

  const roles =
    dbOrganizationId && dbUser
      ? (
          await db
            .from("role_profiles")
            .select("id, role_type, display_name")
            .eq("organization_id", dbOrganizationId)
        ).data ?? []
      : [];

  return {
    clerkUserId: user.id,
    dbUserId: dbUser?.id ?? null,
    activeClerkOrganizationId: authState.orgId,
    activeDbOrganizationId: dbOrganizationId,
    activeOrganizationName: org?.name ?? null,
    activeOrganizationRole: normalizeMembershipRole(authState.orgRole),
    roleProfiles: roles,
  };
}
