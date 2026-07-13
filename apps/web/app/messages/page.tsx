import Link from "next/link";
import type { Metadata } from "next";
import { listThreadsForOrg } from "@bidspace/services";
import { Badge, EmptyState, Icon, PageHeader } from "@bidspace/ui";
import { requireActiveOrgContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

const CONTEXT_LABEL: Record<string, string> = {
  bid: "Bid conversation",
  application: "Application conversation",
  booking: "Booking conversation",
  opportunity: "Opportunity conversation",
  support: "Support",
};

export default async function MessagesPage() {
  const context = await requireActiveOrgContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const threads = await listThreadsForOrg(db, context.activeDbOrganizationId);

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Messages"
        title="Conversations"
        lede="Every thread is anchored to a bid, booking, or opportunity — you always know what you are talking about."
      />
      {threads.length > 0 ? (
        <ul className="grid gap-2">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Link
                href={`/messages/${thread.id}`}
                className="flex items-center justify-between gap-3 rounded-[4px] border border-line bg-surface px-4 py-3.5 transition-colors hover:border-strong dark:bg-surface-dark"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon
                    name={thread.context === "booking" ? "booking" : thread.context === "bid" ? "bid" : thread.context === "application" ? "vendor" : "opportunity"}
                    size={18}
                    className="shrink-0 text-ink-muted dark:text-canvas-muted"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {thread.opportunity?.title ?? thread.application?.opportunity?.title ?? CONTEXT_LABEL[thread.context] ?? "Conversation"}
                    </span>
                    <span className="block text-xs text-ink-muted dark:text-canvas-muted">
                      {CONTEXT_LABEL[thread.context]} · started {formatDateTime(thread.created_at)}
                    </span>
                  </span>
                </span>
                <Badge tone="neutral">{thread.context}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="message"
          title="No conversations yet"
          body="Threads open automatically around bids and bookings — when there is something to discuss, it will be here with its context attached."
        />
      )}
    </div>
  );
}
