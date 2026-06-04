import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { MARKETPLACE_ROLE_TYPE, organizationCreateSchema, roleProfileCreateSchema } from "@bidspace/core";
import { redirect } from "next/navigation";
import { createServerBidspaceClient } from "@/lib/bidspace-server";
import { normalizeMembershipRole } from "@/lib/permissions";

function getUserDisplayName(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>, email: string): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || email;
}

function getBidspaceOrganizationId(organization: { publicMetadata?: unknown }): string | null {
  const metadata =
    organization.publicMetadata && typeof organization.publicMetadata === "object"
      ? (organization.publicMetadata as Record<string, unknown>)
      : null;
  const value = metadata?.bidspaceOrganizationId;
  return typeof value === "string" ? value : null;
}

async function syncUserRecord() {
  const user = await currentUser();
  if (!user) {
    return null;
  }

  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("Authenticated user must have an email address");
  }

  const fullName = getUserDisplayName(user, email);
  const db = createServerBidspaceClient();

  const { data: existing } = await db.from("users").select("id").eq("auth_provider_id", user.id).maybeSingle();
  if (existing?.id) {
    return existing.id;
  }

  const { data: inserted, error } = await db
    .from("users")
    .insert({
      auth_provider_id: user.id,
      email,
      full_name: fullName,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return inserted.id as string;
}

async function ensureOrganizationRecord(clerkOrgId: string, userId: string, fallbackName: string) {
  const clerk = await clerkClient();
  const org = await clerk.organizations.getOrganization({ organizationId: clerkOrgId });

  const db = createServerBidspaceClient();
  const existingDbOrgId = getBidspaceOrganizationId(org);

  if (existingDbOrgId) {
    return { dbOrganizationId: existingDbOrgId, organizationName: org.name || fallbackName, org };
  }

  const organizationInput = organizationCreateSchema.parse({
    name: org.name || fallbackName,
    organizationType: "multi",
    legalName: org.name || fallbackName,
    email: undefined,
    websiteUrl: undefined,
    description: undefined,
  });

  const { data: inserted, error } = await db
    .from("organizations")
    .insert({
      name: organizationInput.name,
      legal_name: organizationInput.legalName,
      organization_type: organizationInput.organizationType,
      description: organizationInput.description,
      website_url: organizationInput.websiteUrl,
      email: organizationInput.email,
      created_by_user_id: userId,
      status: "active",
      verification_status: "not_started",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  await clerk.organizations.updateOrganizationMetadata(clerkOrgId, {
    publicMetadata: {
      ...org.publicMetadata,
      bidspaceOrganizationId: inserted.id,
    },
  });

  return { dbOrganizationId: inserted.id as string, organizationName: org.name || fallbackName, org };
}

export async function POST(request: Request) {
  const authState = await auth();
  if (!authState.userId || !authState.orgId) {
    redirect("/onboarding");
  }

  const dbUserId = await syncUserRecord();
  if (!dbUserId) {
    redirect("/sign-in");
  }

  const formData = await request.formData();
  const selectedRoles = formData
    .getAll("roles")
    .map((value) => String(value))
    .filter((value): value is (typeof MARKETPLACE_ROLE_TYPE)[number] =>
      (MARKETPLACE_ROLE_TYPE as readonly string[]).includes(value),
    );

  if (selectedRoles.length === 0) {
    redirect("/onboarding?error=roles_required");
  }

  const fallbackName = String(formData.get("organizationName") || "My Organization");
  const { dbOrganizationId, organizationName } = await ensureOrganizationRecord(authState.orgId, dbUserId, fallbackName);

  const db = createServerBidspaceClient();
  const { error: membershipError } = await db.from("organization_memberships").upsert(
    {
      organization_id: dbOrganizationId,
      user_id: dbUserId,
      role: normalizeMembershipRole(authState.orgRole) ?? "member",
      status: "active",
    },
    { onConflict: "organization_id,user_id" },
  );
  if (membershipError) {
    throw membershipError;
  }

  const profileRows = selectedRoles.map((roleType) =>
    roleProfileCreateSchema.parse({
      organizationId: dbOrganizationId,
      roleType,
      displayName: `${organizationName} (${roleType})`,
      categoryTags: [],
    }),
  );

  const { error: profileError } = await db.from("role_profiles").upsert(
    profileRows.map((profile) => ({
      organization_id: profile.organizationId,
      role_type: profile.roleType,
      display_name: profile.displayName,
      slug: profile.slug ?? null,
      bio: profile.bio ?? null,
      category_tags: profile.categoryTags,
    })),
    { onConflict: "organization_id,role_type" },
  );
  if (profileError) {
    throw profileError;
  }

  redirect("/dashboard");
}
