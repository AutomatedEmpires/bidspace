import type { ReactNode } from "react";
import { cn } from "./cn";

export interface DescriptionItem {
  term: string;
  detail: ReactNode;
}

// Spec-sheet style facts block — the standard way BidSpace presents the
// attributes of a space, opportunity, or booking.
export function DescriptionList({
  items,
  columns = 2,
  className,
}: {
  items: readonly DescriptionItem[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const visible = items.filter((item) => item.detail !== null && item.detail !== undefined && item.detail !== "");
  if (visible.length === 0) return null;
  return (
    <dl
      className={cn(
        "grid gap-x-8 gap-y-4",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {visible.map((item) => (
        <div key={item.term} className="border-t border-line pt-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted dark:text-canvas-muted">
            {item.term}
          </dt>
          <dd className="mt-1 text-sm leading-relaxed">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}
