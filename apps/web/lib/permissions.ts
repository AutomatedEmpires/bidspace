import type { OrganizationMemberRole } from "@bidspace/core";

const ROLE_PRIORITY = ["viewer", "member", "manager", "admin", "owner"] as const;

export function hasOrgRole(requiredRole: OrganizationMemberRole, actualRole: string | null | undefined): boolean {
  const normalizedRole = normalizeMembershipRole(actualRole);
  if (!normalizedRole) {
    return false;
  }

  return ROLE_PRIORITY.indexOf(normalizedRole) >= ROLE_PRIORITY.indexOf(requiredRole);
}

export function normalizeMembershipRole(role: string | null | undefined): OrganizationMemberRole | null {
  if (!role) {
    return null;
  }

  const normalized = role.startsWith("org:") ? role.slice(4) : role;
  if (ROLE_PRIORITY.includes(normalized as OrganizationMemberRole)) {
    return normalized as OrganizationMemberRole;
  }

  return null;
}
