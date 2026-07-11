/**
 * Live verification of recurring-release copy-forward: clones the Night Market
 * release onto a new window, asserts the clone + shifted units, then deletes
 * the clone (units cascade). Run like live-loop-check.ts.
 */
import { createBidspaceClient } from "@bidspace/db";
import {
  duplicateOpportunityForWindow,
  listInventoryUnitsForOpportunity,
} from "@bidspace/services";

const SOURCE = "60000000-0000-4000-8000-000000000002"; // August Night Market

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("FAIL: env not set");
  process.exit(1);
}
const db = createBidspaceClient({ url, key });

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? "  ok " : "  FAIL"} ${label}: ${String(actual)}${ok ? "" : ` (expected ${String(expected)})`}`);
}

async function main() {
  console.log("== live copy-forward ==");
  const clone = await duplicateOpportunityForWindow(db, SOURCE, {
    startsAt: "2026-09-02T23:00:00.000Z",
    endsAt: "2026-09-24T04:00:00.000Z",
    bidDeadline: "2026-08-21T07:00:00.000Z",
    title: "September Night Market — Maker Stalls",
  });
  try {
    check("clone is draft", clone.status, "draft");
    check("clone visibility carried", clone.visibility, "public");
    check("clone floor carried", clone.minimum_bid_cents, 22000);
    check("clone window start", clone.starts_at, "2026-09-02T23:00:00+00:00");

    const units = await listInventoryUnitsForOpportunity(db, clone.id);
    check("units cloned", units.length, 2);
    const stall12 = units.find((u) => u.name.startsWith("Stall 12"));
    check("unit availability shifted", stall12?.availability_start, "2026-09-02T21:00:00+00:00");
    check("unit floor carried", stall12?.minimum_bid_cents, 22000);
    check("unit draft", stall12?.status, "draft");
    check("unit location carried", Boolean(stall12?.location), true);
  } finally {
    await db.from("opportunities").delete().eq("id", clone.id); // units cascade
  }
  const remaining = await db
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("id", clone.id);
  check("clone cleaned up", remaining.count ?? 0, 0);

  console.log(failures === 0 ? "== PASS ==" : `== ${failures} FAILURES ==`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("FAIL:", error);
  process.exit(1);
});
