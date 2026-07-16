import type { ApplicationRow, BidspaceClient, InventoryUnitRow } from "@bidspace/db";
import {
  applicationCreateSchema,
  type ApplicationCreate,
  type ApplicationStatus,
} from "@bidspace/core";
import { getInventoryUnit } from "./inventory-units";
import { getOpportunity } from "./opportunities";
import { NotFoundError, TransitionError, ValidationError, fromDbError } from "./errors";

const TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  draft: ["submitted", "withdrawn"],
  invited: ["submitted", "declined", "expired"],
  submitted: ["under_review", "shortlisted", "approved", "declined", "waitlisted", "withdrawn"],
  under_review: ["shortlisted", "approved", "declined", "waitlisted", "withdrawn"],
  shortlisted: ["approved", "declined", "waitlisted", "withdrawn"],
  approved: [],
  declined: [],
  waitlisted: ["shortlisted", "approved", "declined", "withdrawn", "expired"],
  withdrawn: [],
  expired: [],
};

export function canTransitionApplication(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export async function placeApplication(
  db: BidspaceClient,
  input: ApplicationCreate,
): Promise<ApplicationRow> {
  const parsed = applicationCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid application", parsed.error.flatten());
  }
  const value = parsed.data;
  const opportunity = await getOpportunity(db, value.opportunityId);
  if (!["published", "receiving_bids"].includes(opportunity.status)) {
    throw new ValidationError("This space is not accepting applications.");
  }
  if (!["application", "host_approval", "waitlist", "invite_only", "fixed_fee"].includes(opportunity.allocation_mode)) {
    throw new ValidationError("This space is accepting bids, not applications.");
  }

  let unit: InventoryUnitRow | null = null;
  if (value.inventoryUnitId) {
    unit = await getInventoryUnit(db, value.inventoryUnitId);
    if (unit.opportunity_id !== opportunity.id) {
      throw new ValidationError("The selected space does not belong to this listing.");
    }
    if (!["available", "receiving_bids", "shortlisted"].includes(unit.status)) {
      throw new ValidationError("This space is not accepting applications.");
    }
  }

  const { data, error } = await db
    .from("applications")
    .insert({
      vendor_organization_id: value.vendorOrganizationId,
      host_organization_id: opportunity.organization_id,
      opportunity_id: opportunity.id,
      inventory_unit_id: unit?.id ?? null,
      pitch: value.pitch,
      setup_description: value.setupDescription ?? null,
      space_needs: value.spaceNeeds ?? null,
      category: value.category ?? null,
      power_needs: value.powerNeeds ?? null,
      water_needs: value.waterNeeds ?? null,
      created_by_user_id: value.createdByUserId ?? null,
      status: "submitted" satisfies ApplicationStatus,
    })
    .select("*")
    .single();
  if (error) throw fromDbError("placeApplication", error);
  return data as ApplicationRow;
}

export async function getApplication(db: BidspaceClient, id: string): Promise<ApplicationRow> {
  const { data, error } = await db.from("applications").select("*").eq("id", id).maybeSingle();
  if (error) throw fromDbError("getApplication", error);
  if (!data) throw new NotFoundError("application", id);
  return data as ApplicationRow;
}

export async function transitionApplication(
  db: BidspaceClient,
  id: string,
  to: ApplicationStatus,
): Promise<ApplicationRow> {
  const current = await getApplication(db, id);
  if (!canTransitionApplication(current.status, to)) {
    throw new TransitionError(`Illegal application transition: ${current.status} -> ${to}`);
  }
  const { data, error } = await db
    .from("applications")
    .update({ status: to })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromDbError("transitionApplication", error);
  return data as ApplicationRow;
}

export interface ApplicationWithContext extends ApplicationRow {
  opportunity: { id: string; title: string; slug: string | null; status: string } | null;
  inventory_unit: { id: string; name: string } | null;
  vendor_organization: {
    id: string;
    name: string;
    logo_url: string | null;
    verification_status: string;
  } | null;
}

const APPLICATION_CONTEXT_SELECT = `*,
  opportunity:opportunities(id, title, slug, status),
  inventory_unit:inventory_units(id, name),
  vendor_organization:organizations!applications_vendor_organization_id_fkey(id, name, logo_url, verification_status)`;

export async function listApplicationsForHostOrg(
  db: BidspaceClient,
  hostOrganizationId: string,
): Promise<ApplicationWithContext[]> {
  const { data, error } = await db
    .from("applications")
    .select(APPLICATION_CONTEXT_SELECT)
    .eq("host_organization_id", hostOrganizationId)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listApplicationsForHostOrg", error);
  return (data ?? []) as unknown as ApplicationWithContext[];
}

export async function listApplicationsForVendorOrg(
  db: BidspaceClient,
  vendorOrganizationId: string,
): Promise<ApplicationWithContext[]> {
  const { data, error } = await db
    .from("applications")
    .select(APPLICATION_CONTEXT_SELECT)
    .eq("vendor_organization_id", vendorOrganizationId)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listApplicationsForVendorOrg", error);
  return (data ?? []) as unknown as ApplicationWithContext[];
}

export const APPLICATION_REVIEW_STATUSES: readonly ApplicationStatus[] = [
  "submitted",
  "under_review",
  "shortlisted",
  "waitlisted",
];
