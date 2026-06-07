import "server-only";
import type { BidRow, BookingRow, InventoryUnitRow, OpportunityRow, OrganizationRow, PaymentRow } from "@bidspace/db";
import type { BidStatus, MarketplaceRoleType } from "@bidspace/core";
import { bidStatusTransitions, formatMoney } from "@bidspace/core";
import { createServerBidspaceClient } from "./bidspace-server";
import { getCurrentUserOrgContext } from "./auth-context";

export type WorkflowErrorCode = "missing_org" | "missing_role" | "not_found" | "forbidden" | "invalid" | "server";

export class WorkflowError extends Error {
  constructor(
    message: string,
    readonly code: WorkflowErrorCode = "invalid",
  ) {
    super(message);
    this.name = "WorkflowError";
  }
}

export interface ActiveOrgContext {
  organizationId: string;
  organizationName: string;
  roleTypes: Set<MarketplaceRoleType>;
}

export interface BidWorkflowRecord {
  bid: BidRow;
  opportunity: OpportunityRow | null;
  unit: InventoryUnitRow | null;
  booking: BookingRow | null;
  payment: PaymentRow | null;
  bidderOrganization: OrganizationRow | null;
  hostOrganization: OrganizationRow | null;
}

export async function requireActiveOrganization(requiredRole?: MarketplaceRoleType): Promise<ActiveOrgContext> {
  const context = await getCurrentUserOrgContext();
  if (!context?.activeDbOrganizationId) {
    throw new WorkflowError("Choose or create a BidSpace organization before using the bid pipeline.", "missing_org");
  }

  const roleTypes = new Set(context.roleProfiles.map((profile) => profile.role_type as MarketplaceRoleType));
  if (requiredRole && !roleTypes.has(requiredRole)) {
    throw new WorkflowError(
      `This action requires an active ${requiredRole} role profile for the organization.`,
      "missing_role",
    );
  }

  return {
    organizationId: context.activeDbOrganizationId,
    organizationName: context.activeOrganizationName ?? "Active organization",
    roleTypes,
  };
}

export async function loadBidderWorkflow(organizationId: string): Promise<BidWorkflowRecord[]> {
  const db = createServerBidspaceClient();
  const { data, error } = await db
    .from("bids")
    .select("*")
    .eq("bidder_organization_id", organizationId)
    .order("updated_at", { ascending: false });
  if (error) throw new WorkflowError(error.message, "server");
  return hydrateBidRecords((data ?? []) as BidRow[]);
}

export async function loadHostWorkflow(organizationId: string): Promise<BidWorkflowRecord[]> {
  const db = createServerBidspaceClient();
  const { data, error } = await db
    .from("bids")
    .select("*")
    .eq("host_organization_id", organizationId)
    .order("updated_at", { ascending: false });
  if (error) throw new WorkflowError(error.message, "server");
  return hydrateBidRecords((data ?? []) as BidRow[]);
}

export async function loadUnitBidWorkflow(
  unitId: string,
  bidderOrganizationId?: string,
): Promise<{
  unit: InventoryUnitRow;
  opportunity: OpportunityRow | null;
  ownBids: BidWorkflowRecord[];
}> {
  const db = createServerBidspaceClient();
  const { data: unit, error: unitError } = await db
    .from("inventory_units")
    .select("*")
    .eq("id", unitId)
    .maybeSingle();
  if (unitError) throw new WorkflowError(unitError.message, "server");
  if (!unit) throw new WorkflowError("Inventory unit not found.", "not_found");

  const { data: opportunity, error: opportunityError } = await db
    .from("opportunities")
    .select("*")
    .eq("id", (unit as InventoryUnitRow).opportunity_id)
    .maybeSingle();
  if (opportunityError) throw new WorkflowError(opportunityError.message, "server");

  let ownBids: BidWorkflowRecord[] = [];
  if (bidderOrganizationId) {
    const { data: bids, error: bidsError } = await db
      .from("bids")
      .select("*")
      .eq("inventory_unit_id", unitId)
      .eq("bidder_organization_id", bidderOrganizationId)
      .order("updated_at", { ascending: false });
    if (bidsError) throw new WorkflowError(bidsError.message, "server");
    ownBids = await hydrateBidRecords((bids ?? []) as BidRow[]);
  }

  return {
    unit: unit as InventoryUnitRow,
    opportunity: (opportunity as OpportunityRow | null) ?? null,
    ownBids,
  };
}

export async function hydrateBidRecords(bids: BidRow[]): Promise<BidWorkflowRecord[]> {
  if (bids.length === 0) return [];

  const db = createServerBidspaceClient();
  const opportunityIds = uniqueStrings(bids.map((bid) => bid.opportunity_id));
  const unitIds = uniqueStrings(bids.map((bid) => bid.inventory_unit_id));
  const organizationIds = uniqueStrings([
    ...bids.map((bid) => bid.bidder_organization_id),
    ...bids.map((bid) => bid.host_organization_id),
  ]);
  const bidIds = uniqueStrings(bids.map((bid) => bid.id));

  const [opportunities, units, organizations, bookings] = await Promise.all([
    fetchByIds<OpportunityRow>("opportunities", opportunityIds),
    fetchByIds<InventoryUnitRow>("inventory_units", unitIds),
    fetchByIds<OrganizationRow>("organizations", organizationIds),
    fetchByColumn<BookingRow>("bookings", "bid_id", bidIds),
  ]);

  const bookingIds = uniqueStrings(bookings.map((booking) => booking.id));
  const payments = await fetchByColumn<PaymentRow>("payments", "booking_id", bookingIds);

  const opportunityById = toIdMap(opportunities);
  const unitById = toIdMap(units);
  const organizationById = toIdMap(organizations);
  const bookingByBidId = new Map(bookings.map((booking) => [booking.bid_id, booking]));
  const paymentByBookingId = new Map(payments.map((payment) => [payment.booking_id, payment]));

  return bids.map((bid) => {
    const booking = bookingByBidId.get(bid.id) ?? null;
    return {
      bid,
      opportunity: opportunityById.get(bid.opportunity_id) ?? null,
      unit: bid.inventory_unit_id ? (unitById.get(bid.inventory_unit_id) ?? null) : null,
      booking,
      payment: booking ? (paymentByBookingId.get(booking.id) ?? null) : null,
      bidderOrganization: organizationById.get(bid.bidder_organization_id) ?? null,
      hostOrganization: bid.host_organization_id ? (organizationById.get(bid.host_organization_id) ?? null) : null,
    };
  });
}

export function describeBidStatus(status: BidStatus): { label: string; tone: "neutral" | "success" | "warning" | "danger" } {
  switch (status) {
    case "accepted":
    case "booked":
    case "paid":
    case "completed":
    case "reviewed":
      return { label: humanize(status), tone: "success" };
    case "countered":
    case "waitlisted":
    case "payment_pending":
      return { label: humanize(status), tone: "warning" };
    case "rejected":
    case "withdrawn":
    case "expired":
      return { label: humanize(status), tone: "danger" };
    default:
      return { label: humanize(status), tone: "neutral" };
  }
}

export function bidTimeline(status: BidStatus): Array<{ status: BidStatus; label: string; current: boolean }> {
  const milestones: BidStatus[] = ["submitted", "viewed", "shortlisted", "accepted", "payment_pending", "paid", "booked"];
  const terminal: BidStatus[] = ["countered", "waitlisted", "rejected", "withdrawn", "expired"];
  const visible = milestones.includes(status) ? milestones : [...milestones.slice(0, 3), status, ...terminal.filter((s) => s !== status).slice(0, 1)];
  return visible.map((step) => ({ status: step, label: humanize(step), current: step === status }));
}

export function statusAllows(status: BidStatus, next: BidStatus): boolean {
  return bidStatusTransitions[status]?.includes(next) ?? false;
}

export function effectiveBidCents(bid: BidRow): number {
  return bid.counter_amount_cents ?? bid.amount_cents;
}

export function formatCents(cents: number | null | undefined): string {
  return cents == null ? "—" : formatMoney(cents);
}

export function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0)));
}

async function fetchByIds<T extends { id: string }>(table: string, ids: string[]): Promise<T[]> {
  return fetchByColumn<T>(table, "id", ids);
}

async function fetchByColumn<T extends { id: string }>(table: string, column: string, values: string[]): Promise<T[]> {
  if (values.length === 0) return [];
  const db = createServerBidspaceClient();
  const { data, error } = await db.from(table).select("*").in(column, values);
  if (error) throw new WorkflowError(error.message, "server");
  return (data ?? []) as T[];
}

function toIdMap<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.id, row]));
}
