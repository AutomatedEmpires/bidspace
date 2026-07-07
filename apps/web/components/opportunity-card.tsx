import Link from "next/link";
import Image from "next/image";
import type { PublicOpportunity } from "@bidspace/services";
import { formatMoney } from "@bidspace/core";
import { Badge, Icon, cn } from "@bidspace/ui";
import { describeDeadline, formatDateRange } from "@/lib/format";

const UNIT_TYPE_LABEL: Record<string, string> = {
  vendor_space: "Vendor space",
  sponsor_asset: "Sponsor placement",
  service_slot: "Service slot",
  advertising_placement: "Advertising",
  temporary_real_estate: "Temporary space",
};

const PRICING_LABEL: Record<string, string> = {
  fixed: "Fixed price",
  minimum_bid: "Minimum bid",
  competitive_bid: "Competitive bid",
  hybrid: "Bid or book",
};

export function opportunityHref(opportunity: Pick<PublicOpportunity, "id" | "slug">): string {
  return `/opportunities/${opportunity.slug ?? opportunity.id}`;
}

// The proprietary BidSpace discovery object: place, context, terms, deadline —
// never a wall of pills, never a meaningless score.
export function OpportunityCard({
  opportunity,
  className,
}: {
  opportunity: PublicOpportunity;
  className?: string;
}) {
  const image = opportunity.image_urls?.[0] ?? opportunity.venue?.image_urls?.[0] ?? null;
  const start = opportunity.starts_at ?? opportunity.event?.starts_at ?? null;
  const end = opportunity.ends_at ?? opportunity.event?.ends_at ?? null;
  const deadline = describeDeadline(opportunity.bid_deadline);
  const place = opportunity.venue ? `${opportunity.venue.city}, ${opportunity.venue.state}` : null;
  const hostVerified = opportunity.organization?.verification_status === "verified";

  return (
    <Link
      href={opportunityHref(opportunity)}
      className={cn(
        "group flex flex-col overflow-hidden rounded-[4px] border border-line bg-surface transition-colors hover:border-strong dark:bg-surface-dark",
        className,
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden border-b border-line bg-canvas text-ink-faint dark:bg-ink dark:text-canvas-faint">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="plan-grid flex h-full items-center justify-center">
            <Icon name="pin" size={30} weight="duotone" />
          </div>
        )}
        {opportunity.status === "receiving_bids" ? (
          <span className="absolute left-3 top-3">
            <Badge tone="active" className="bg-surface/95 dark:bg-ink/90">
              Receiving bids
            </Badge>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {place ? (
          <p className="flex items-center gap-1.5 text-xs font-medium text-ink-muted dark:text-canvas-muted">
            <Icon name="pin" size={13} />
            {place}
            {hostVerified ? (
              <span className="ml-auto inline-flex items-center gap-1 text-moss dark:text-moss-bright">
                <Icon name="verified" size={13} weight="fill" /> Verified host
              </span>
            ) : null}
          </p>
        ) : null}

        <h3 className="font-display text-lg font-semibold leading-snug group-hover:underline group-hover:decoration-signal/60 group-hover:underline-offset-4">
          {opportunity.title}
        </h3>

        <p className="text-[13px] text-ink-muted dark:text-canvas-muted">
          {opportunity.commerce_layer || opportunity.event
            ? [
                opportunity.event?.name,
                UNIT_TYPE_LABEL[opportunity.commerce_layer ?? ""] ?? null,
              ]
                .filter(Boolean)
                .join(" · ")
            : PRICING_LABEL[opportunity.pricing_mode]}
        </p>

        <div className="mt-auto grid gap-1 pt-2 text-sm">
          {start && end ? (
            <p className="flex items-center gap-1.5 text-ink-soft dark:text-canvas-soft">
              <Icon name="calendar" size={14} className="text-ink-faint dark:text-canvas-faint" />
              {formatDateRange(start, end)}
            </p>
          ) : null}
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-semibold tabular-nums">
              {opportunity.minimum_bid_cents != null
                ? `From ${formatMoney(opportunity.minimum_bid_cents)}`
                : PRICING_LABEL[opportunity.pricing_mode]}
            </p>
            {deadline ? (
              <p
                className={cn(
                  "text-xs font-medium",
                  deadline === "Closed"
                    ? "text-ink-faint dark:text-canvas-faint"
                    : "text-signal-deep dark:text-signal-bright",
                )}
              >
                {deadline}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
