import "server-only";
import { createBidspaceClient } from "@bidspace/db";

export function createServerBidspaceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  return createBidspaceClient({
    url,
    key,
    persistSession: false,
  });
}
