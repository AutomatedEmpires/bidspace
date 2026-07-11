import type {
  BidspaceClient,
  EventRow,
  InventoryUnitRow,
  OpportunityRow,
  OrganizationRow,
  VenueRow,
} from "@bidspace/db";
import type { CommerceLayer, PricingMode } from "@bidspace/core";
import { NotFoundError, fromDbError } from "./errors";
import { refFromSlug } from "./slug";

// Public marketplace listing queries: opportunities that are live, public, and
// joined with just enough venue/event context to render a discovery card.

export interface PublicOpportunity extends OpportunityRow {
  venue: Pick<VenueRow, "id" | "name" | "slug" | "city" | "state" | "venue_type" | "image_urls"> | null;
  event: Pick<EventRow, "id" | "name" | "starts_at" | "ends_at" | "estimated_attendance" | "event_type"> | null;
  organization: Pick<OrganizationRow, "id" | "name" | "verification_status" | "logo_url"> | null;
}

const PUBLIC_SELECT = `*,
  venue:venues(id, name, slug, city, state, venue_type, image_urls),
  event:events(id, name, starts_at, ends_at, estimated_attendance, event_type),
  organization:organizations(id, name, verification_status, logo_url)`;

export interface PublicOpportunityFilters {
  state?: string;
  category?: string;
  pricingMode?: PricingMode;
  commerceLayer?: CommerceLayer;
  limit?: number;
}

export async function listPublicOpportunities(
  db: BidspaceClient,
  filters: PublicOpportunityFilters = {},
): Promise<PublicOpportunity[]> {
  let query = db
    .from("opportunities")
    .select(PUBLIC_SELECT)
    .in("status", ["published", "receiving_bids"])
    .eq("visibility", "public")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(Math.min(filters.limit ?? 60, 200));

  if (filters.pricingMode) query = query.eq("pricing_mode", filters.pricingMode);
  if (filters.commerceLayer) query = query.eq("commerce_layer", filters.commerceLayer);
  if (filters.category) query = query.contains("category_tags", [filters.category]);

  const { data, error } = await query;
  if (error) throw fromDbError("listPublicOpportunities", error);
  let rows = (data ?? []) as unknown as PublicOpportunity[];
  // Venue state lives on the joined row; filter in memory to keep one query.
  if (filters.state) {
    const wanted = filters.state.toLowerCase();
    rows = rows.filter((r) => r.venue?.state?.toLowerCase() === wanted);
  }
  return rows;
}

// Resolves a public slug (`downtown-market-9f3a21c4`, persisted on publish)
// or a raw uuid (host/manage flows link by id before a slug exists).
export async function getOpportunityByRef(
  db: BidspaceClient,
  slugOrId: string,
): Promise<PublicOpportunity> {
  const ref = refFromSlug(slugOrId);
  const isUuid = ref.length === 36;
  const query = db.from("opportunities").select(PUBLIC_SELECT).limit(1);
  const { data, error } = await (isUuid
    ? query.eq("id", ref)
    : query.eq("slug", slugOrId)
  ).maybeSingle();
  if (error) throw fromDbError("getOpportunityByRef", error);
  if (!data) throw new NotFoundError("opportunity", slugOrId);
  return data as unknown as PublicOpportunity;
}

export async function listUnitsWithOpportunity(
  db: BidspaceClient,
  opportunityId: string,
): Promise<InventoryUnitRow[]> {
  const { data, error } = await db
    .from("inventory_units")
    .select("*")
    .eq("opportunity_id", opportunityId)
    .is("archived_at", null)
    .order("name", { ascending: true });
  if (error) throw fromDbError("listUnitsWithOpportunity", error);
  return (data ?? []) as InventoryUnitRow[];
}
