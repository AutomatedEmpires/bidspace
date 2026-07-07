import type { Metadata } from "next";
import Link from "next/link";
import {
  listBookingsForOrg,
  listEventsForOrg,
  listOpportunitiesForOrg,
} from "@bidspace/services";
import { EmptyState, PageHeader, cn } from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

interface CalendarEntry {
  kind: "event" | "opportunity" | "booking";
  label: string;
  href: string;
  start: Date;
  end: Date;
}

const KIND_CLASS: Record<CalendarEntry["kind"], string> = {
  event: "bg-plan/15 text-plan dark:bg-plan/30 dark:text-plan-bright",
  opportunity: "bg-signal/15 text-signal-deep dark:bg-signal/25 dark:text-signal-bright",
  booking: "bg-moss/15 text-moss dark:bg-moss/25 dark:text-moss-bright",
};

function monthGrid(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function overlapsDay(entry: CalendarEntry, day: Date): boolean {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  return entry.start < dayEnd && entry.end >= dayStart;
}

export default async function HostCalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireHostContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const params = await searchParams;
  const monthParam = typeof params.month === "string" ? params.month : null; // YYYY-MM
  const now = new Date();
  const anchor = monthParam
    ? new Date(Number(monthParam.slice(0, 4)), Number(monthParam.slice(5, 7)) - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  const orgId = context.activeDbOrganizationId;
  const [events, opportunities, bookings] = await Promise.all([
    listEventsForOrg(db, orgId),
    listOpportunitiesForOrg(db, orgId),
    listBookingsForOrg(db, orgId, "host"),
  ]);

  const entries: CalendarEntry[] = [
    ...events.map((e) => ({
      kind: "event" as const,
      label: e.name,
      href: "/host/events",
      start: new Date(e.starts_at),
      end: new Date(e.ends_at),
    })),
    ...opportunities
      .filter((o) => o.starts_at && o.ends_at)
      .map((o) => ({
        kind: "opportunity" as const,
        label: o.title,
        href: `/host/opportunities/${o.id}`,
        start: new Date(o.starts_at!),
        end: new Date(o.ends_at!),
      })),
    ...bookings
      .filter((b) => !["cancelled"].includes(b.status))
      .map((b) => ({
        kind: "booking" as const,
        label: `${b.bidder_organization?.name ?? "Vendor"} — ${b.inventory_unit?.name ?? "position"}`,
        href: "/host/bookings",
        start: new Date(b.starts_at),
        end: new Date(b.ends_at),
      })),
  ];

  const days = monthGrid(anchor);
  const monthLabel = anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const prev = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
  const next = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker="Calendar"
        title={monthLabel}
        lede="What space is available when — events, releases, and confirmed bookings in one view."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/host/calendar?month=${monthKey(prev)}`}
              className="rounded-[3px] border border-line px-3 py-1.5 text-sm font-medium hover:border-strong"
            >
              ← {prev.toLocaleDateString("en-US", { month: "short" })}
            </Link>
            <Link
              href={`/host/calendar?month=${monthKey(next)}`}
              className="rounded-[3px] border border-line px-3 py-1.5 text-sm font-medium hover:border-strong"
            >
              {next.toLocaleDateString("en-US", { month: "short" })} →
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-4 text-xs font-semibold">
        {(["event", "opportunity", "booking"] as const).map((kind) => (
          <span key={kind} className={cn("rounded-[3px] px-2 py-0.5 capitalize", KIND_CLASS[kind])}>
            {kind}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[840px] overflow-hidden rounded-[4px] border border-line">
          <div className="grid grid-cols-7 border-b border-line bg-ink/[0.03] dark:bg-canvas/[0.04]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted dark:text-canvas-muted">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const inMonth = day.getMonth() === anchor.getMonth();
              const dayEntries = entries.filter((entry) => overlapsDay(entry, day));
              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[96px] border-b border-r border-line p-1.5 text-xs",
                    !inMonth && "bg-ink/[0.02] opacity-50 dark:bg-canvas/[0.03]",
                  )}
                >
                  <p
                    className={cn(
                      "mb-1 text-right text-[11px] font-semibold tabular-nums",
                      sameDay(day, now)
                        ? "text-signal"
                        : "text-ink-muted dark:text-canvas-muted",
                    )}
                  >
                    {day.getDate()}
                  </p>
                  <div className="grid gap-1">
                    {dayEntries.slice(0, 3).map((entry, j) => (
                      <Link
                        key={j}
                        href={entry.href}
                        title={entry.label}
                        className={cn("truncate rounded-[2px] px-1.5 py-0.5 text-[10px] font-semibold", KIND_CLASS[entry.kind])}
                      >
                        {entry.label}
                      </Link>
                    ))}
                    {dayEntries.length > 3 ? (
                      <p className="px-1 text-[10px] text-ink-muted dark:text-canvas-muted">
                        +{dayEntries.length - 3} more
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
