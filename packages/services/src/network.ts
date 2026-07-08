import type {
  BidspaceClient,
  OpportunityInvitationRow,
  OpportunityRow,
  VendorNetworkMemberRow,
} from "@bidspace/db";
import {
  networkInviteSchema,
  opportunityInviteSchema,
  type NetworkInvite,
  type OpportunityInvite,
  type NetworkMemberStatus,
  type InvitationStatus,
} from "@bidspace/core";
import { NotFoundError, ValidationError, fromDbError } from "./errors";

// --- Pure visibility rule ----------------------------------------------------
// One rule decides who can see an opportunity, shared by public listings,
// vendor discovery, and direct links. Private and public marketplace flows use
// the same canonical objects; visibility is a property, not a product.
export interface VisibilityContext {
  viewerOrganizationId: string | null;
  isActiveNetworkMember: boolean;
  isInvited: boolean;
}

export function canSeeOpportunity(
  opportunity: Pick<OpportunityRow, "visibility" | "organization_id">,
  ctx: VisibilityContext,
): boolean {
  if (ctx.viewerOrganizationId && ctx.viewerOrganizationId === opportunity.organization_id) {
    return true; // the host always sees its own supply
  }
  switch (opportunity.visibility) {
    case "public":
      return true;
    case "network":
      return ctx.isActiveNetworkMember || ctx.isInvited;
    case "invite_only":
      return ctx.isInvited;
    default:
      return false;
  }
}

// DB-backed convenience over the pure rule: resolves the viewer's network +
// invitation state and returns whether they may see this opportunity. Use this
// anywhere a non-public opportunity (or its units) could be reached by id —
// detail pages AND mutation server actions must both enforce it, since a server
// action is directly invokable regardless of what the page rendered.
export async function canOrgViewOpportunity(
  db: BidspaceClient,
  opportunity: Pick<OpportunityRow, "id" | "visibility" | "organization_id">,
  viewerOrganizationId: string | null,
): Promise<boolean> {
  if (opportunity.visibility === "public") return true;
  if (!viewerOrganizationId) return false;
  if (viewerOrganizationId === opportunity.organization_id) return true;
  const [member, invited] = await Promise.all([
    isActiveNetworkMember(db, opportunity.organization_id, viewerOrganizationId),
    isInvitedToOpportunity(db, opportunity.id, viewerOrganizationId),
  ]);
  return canSeeOpportunity(opportunity, {
    viewerOrganizationId,
    isActiveNetworkMember: member,
    isInvited: invited,
  });
}

// --- Vendor network ----------------------------------------------------------

export async function inviteVendorToNetwork(
  db: BidspaceClient,
  input: NetworkInvite,
): Promise<VendorNetworkMemberRow> {
  const parsed = networkInviteSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError("Invalid network invite", parsed.error.flatten());
  const v = parsed.data;
  if (v.hostOrganizationId === v.vendorOrganizationId) {
    throw new ValidationError("An organization cannot invite itself to its own network");
  }
  const { data, error } = await db
    .from("vendor_network_members")
    .upsert(
      {
        host_organization_id: v.hostOrganizationId,
        vendor_organization_id: v.vendorOrganizationId,
        note: v.note ?? null,
        status: "invited",
      },
      { onConflict: "host_organization_id,vendor_organization_id" },
    )
    .select("*")
    .single();
  if (error) throw fromDbError("inviteVendorToNetwork", error);
  return data as VendorNetworkMemberRow;
}

export async function setNetworkMemberStatus(
  db: BidspaceClient,
  id: string,
  status: NetworkMemberStatus,
): Promise<VendorNetworkMemberRow> {
  const { data, error } = await db
    .from("vendor_network_members")
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw fromDbError("setNetworkMemberStatus", error);
  if (!data) throw new NotFoundError("vendor_network_member", id);
  return data as VendorNetworkMemberRow;
}

export async function listNetworkForHost(
  db: BidspaceClient,
  hostOrganizationId: string,
): Promise<VendorNetworkMemberRow[]> {
  const { data, error } = await db
    .from("vendor_network_members")
    .select("*")
    .eq("host_organization_id", hostOrganizationId)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listNetworkForHost", error);
  return (data ?? []) as VendorNetworkMemberRow[];
}

export async function listNetworksForVendor(
  db: BidspaceClient,
  vendorOrganizationId: string,
): Promise<VendorNetworkMemberRow[]> {
  const { data, error } = await db
    .from("vendor_network_members")
    .select("*")
    .eq("vendor_organization_id", vendorOrganizationId)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listNetworksForVendor", error);
  return (data ?? []) as VendorNetworkMemberRow[];
}

export async function isActiveNetworkMember(
  db: BidspaceClient,
  hostOrganizationId: string,
  vendorOrganizationId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from("vendor_network_members")
    .select("id")
    .eq("host_organization_id", hostOrganizationId)
    .eq("vendor_organization_id", vendorOrganizationId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw fromDbError("isActiveNetworkMember", error);
  return Boolean(data);
}

// --- Opportunity invitations ---------------------------------------------------

export async function inviteToOpportunity(
  db: BidspaceClient,
  input: OpportunityInvite,
): Promise<OpportunityInvitationRow> {
  const parsed = opportunityInviteSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid opportunity invitation", parsed.error.flatten());
  }
  const v = parsed.data;
  const { data, error } = await db
    .from("opportunity_invitations")
    .upsert(
      {
        opportunity_id: v.opportunityId,
        vendor_organization_id: v.vendorOrganizationId,
        message: v.message ?? null,
        status: "sent",
      },
      { onConflict: "opportunity_id,vendor_organization_id" },
    )
    .select("*")
    .single();
  if (error) throw fromDbError("inviteToOpportunity", error);
  return data as OpportunityInvitationRow;
}

export async function setInvitationStatus(
  db: BidspaceClient,
  id: string,
  status: InvitationStatus,
): Promise<OpportunityInvitationRow> {
  const { data, error } = await db
    .from("opportunity_invitations")
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw fromDbError("setInvitationStatus", error);
  if (!data) throw new NotFoundError("opportunity_invitation", id);
  return data as OpportunityInvitationRow;
}

export async function listInvitationsForOpportunity(
  db: BidspaceClient,
  opportunityId: string,
): Promise<OpportunityInvitationRow[]> {
  const { data, error } = await db
    .from("opportunity_invitations")
    .select("*")
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listInvitationsForOpportunity", error);
  return (data ?? []) as OpportunityInvitationRow[];
}

export async function listInvitationsForVendor(
  db: BidspaceClient,
  vendorOrganizationId: string,
): Promise<OpportunityInvitationRow[]> {
  const { data, error } = await db
    .from("opportunity_invitations")
    .select("*")
    .eq("vendor_organization_id", vendorOrganizationId)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listInvitationsForVendor", error);
  return (data ?? []) as OpportunityInvitationRow[];
}

export async function isInvitedToOpportunity(
  db: BidspaceClient,
  opportunityId: string,
  vendorOrganizationId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from("opportunity_invitations")
    .select("id")
    .eq("opportunity_id", opportunityId)
    .eq("vendor_organization_id", vendorOrganizationId)
    .neq("status", "declined")
    .maybeSingle();
  if (error) throw fromDbError("isInvitedToOpportunity", error);
  return Boolean(data);
}
