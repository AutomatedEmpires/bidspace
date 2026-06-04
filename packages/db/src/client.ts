import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Until generated types land (see gen:types), the client is intentionally
// untyped at the schema level; consumers use the row contracts in ./types.
export type BidspaceClient = SupabaseClient;

export interface BidspaceClientOptions {
  url: string;
  key: string;
  /** Set true only in browser/session contexts; false for server-side/service-role use. */
  persistSession?: boolean;
}

export function createBidspaceClient(options: BidspaceClientOptions): BidspaceClient {
  const { url, key, persistSession = false } = options;
  if (!url || !key) {
    throw new Error("createBidspaceClient requires both url and key");
  }
  return createClient(url, key, { auth: { persistSession } });
}
