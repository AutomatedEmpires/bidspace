import Link from "next/link";
import type { Metadata } from "next";
import { listPublicOpportunities, type PublicOpportunityFilters } from "@bidspace/services";
import { PRICING_MODE, type PricingMode } from "@bidspace/core";
import { Button, EmptyState, Icon, Select, buttonClasses } from "@bidspace/ui";
import { OpportunityCard } from "@/components/opportunity-card";
import { tryGetDb } from "@/lib/safe-db";

export const metadata: Metadata = {
  title: "Explore opportunities",
  description:
    "Browse open vendor spaces, food-truck pads, kiosks, sponsor placements, and temporary commercial opportunities.",
};

const CATEGORY_OPTIONS = [
  "food",
  "beverage",
  "retail",
  "makers",
  "services",
  "sponsorship",
  "entertainment",
] as const;

const PRICING_LABEL: Record<string, string> = {
  fixed: "Fixed price",
  minimum_bid: "Minimum bid",
  competitive_bid: "Competitive bid",
  hybrid: "Bid or book",
};

function parseFilters(params: Record<string, string | string[] | undefined>): PublicOpportunityFilters {
  const single = (key: string) => {
    const value = params[key];
    return typeof value === "string" && value ? value : undefined;
  };
  const mode = single("mode");
  return {
    category: single("category"),
    state: single("state"),
    pricingMode: mode && (PRICING_MODE as readonly string[]).includes(mode) ? (mode as PricingMode) : undefined,
  };
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const db = tryGetDb();
  const opportunities = db ? await listPublicOpportunities(db, filters).catch(() => []) : [];
  const hasFilters = Boolean(filters.category || filters.state || filters.pricingMode);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker mb-2">Discovery</p>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Open opportunities</h1>
        </div>
        <Link href="/map" className={buttonClasses("secondary", "md")}>
          <Icon name="map" size={18} />
          Map view
        </Link>
      </div>

      {/* Filters — plain GET form, works without JS */}
      <form
        method="get"
        className="mt-8 grid gap-3 rounded-[4px] border border-line bg-surface p-4 dark:bg-surface-dark sm:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <Select name="category" defaultValue={filters.category ?? ""} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c[0]?.toUpperCase() + c.slice(1)}
            </option>
          ))}
        </Select>
        <Select name="state" defaultValue={filters.state ?? ""} aria-label="State">
          <option value="">Anywhere</option>
          {["WA", "OR", "ID", "MT", "CA", "AZ", "TX", "CO", "UT", "NV"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select name="mode" defaultValue={filters.pricingMode ?? ""} aria-label="Pricing mode">
          <option value="">Any terms</option>
          {PRICING_MODE.map((m) => (
            <option key={m} value={m}>
              {PRICING_LABEL[m]}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="primary" size="md">
          <Icon name="filter" size={16} />
          Filter
        </Button>
      </form>

      <div className="mt-8">
        {opportunities.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        ) : hasFilters ? (
          <EmptyState
            icon="search"
            title="Nothing matches these filters right now"
            body="Supply changes weekly as hosts release new dates. Widen the area or category to see more."
            actions={
              <Link href="/explore" className={buttonClasses("secondary", "sm")}>
                Clear filters
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon="opportunity"
            title="The first public opportunities are being prepared"
            body="Hosts are setting up their locations and inventory. If you control commercial space, this is the moment to be early."
            actions={
              <>
                <Link href="/for-hosts" className={buttonClasses("signal", "sm")}>
                  List commercial space
                </Link>
                <Link href="/how-it-works" className={buttonClasses("secondary", "sm")}>
                  How BidSpace works
                </Link>
              </>
            }
          />
        )}
      </div>
    </div>
  );
}
