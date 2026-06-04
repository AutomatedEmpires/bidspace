import "server-only";
import { createBidspaceClient } from "@bidspace/db";
import { getRequiredEnv } from "./env";

export function createServerBidspaceClient() {
  const url = getRequiredEnv("SUPABASE_URL");
  const key = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createBidspaceClient({
    url,
    key,
    persistSession: false,
  });
}
