import "server-only";
import type { BidspaceClient } from "@bidspace/db";
import { createServerBidspaceClient } from "./bidspace-server";

// Public surfaces degrade honestly when the database is not configured
// (e.g. preview without secrets): they render with explicit empty states
// instead of crashing or faking data.
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function tryGetDb(): BidspaceClient | null {
  if (!isDatabaseConfigured()) return null;
  return createServerBidspaceClient();
}
