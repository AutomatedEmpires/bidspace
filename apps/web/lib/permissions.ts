const ROLE_PRIORITY = ["viewer", "member", "manager", "admin", "owner"] as const;

export type OrganizationMembershipRole = (typeof ROLE_PRIORITY)[number];

export function hasOrgRole(requiredRole: OrganizationMembershipRole, actualRole: string | null | undefined): boolean {
  const normalizedRole = normalizeMembershipRole(actualRole);
  if (!normalizedRole) {
    return false;
  }

  return ROLE_PRIORITY.indexOf(normalizedRole) >= ROLE_PRIORITY.indexOf(requiredRole);
}

export function normalizeMembershipRole(role: string | null | undefined): OrganizationMembershipRole | null {
  if (!role) {
    return null;
  }

  const normalized = role.startsWith("org:") ? role.slice(4) : role;
  if (ROLE_PRIORITY.includes(normalized as OrganizationMembershipRole)) {
    return normalized as OrganizationMembershipRole;
  }

  return null;
}
