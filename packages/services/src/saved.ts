import type { BidspaceClient, SavedOpportunityRow } from "@bidspace/db";
import { fromDbError } from "./errors";

export async function saveOpportunity(
  db: BidspaceClient,
  organizationId: string,
  opportunityId: string,
  savedByUserId?: string,
): Promise<SavedOpportunityRow> {
  const { data, error } = await db
    .from("saved_opportunities")
    .upsert(
      {
        organization_id: organizationId,
        opportunity_id: opportunityId,
        saved_by_user_id: savedByUserId ?? null,
      },
      { onConflict: "organization_id,opportunity_id" },
    )
    .select("*")
    .single();
  if (error) throw fromDbError("saveOpportunity", error);
  return data as SavedOpportunityRow;
}

export async function unsaveOpportunity(
  db: BidspaceClient,
  organizationId: string,
  opportunityId: string,
): Promise<void> {
  const { error } = await db
    .from("saved_opportunities")
    .delete()
    .eq("organization_id", organizationId)
    .eq("opportunity_id", opportunityId);
  if (error) throw fromDbError("unsaveOpportunity", error);
}

export async function listSavedOpportunityIds(
  db: BidspaceClient,
  organizationId: string,
): Promise<string[]> {
  const { data, error } = await db
    .from("saved_opportunities")
    .select("opportunity_id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listSavedOpportunityIds", error);
  return (data ?? []).map((row) => (row as { opportunity_id: string }).opportunity_id);
}
