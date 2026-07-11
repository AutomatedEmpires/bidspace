import type { ReactNode } from "react";
import { cn } from "./cn";
import { Icon, type IconName } from "./icon";

// Every empty state names the user's actual situation and the next move —
// never a generic "No data available".
export function EmptyState({
  icon = "inventory",
  title,
  body,
  actions,
  className,
}: {
  icon?: IconName;
  title: string;
  body?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[4px] border border-dashed border-strong px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-ink/[0.05] text-ink-muted dark:bg-canvas/[0.08] dark:text-canvas-muted">
        <Icon name={icon} size={22} />
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {body ? <div className="max-w-md text-sm text-ink-muted dark:text-canvas-muted">{body}</div> : null}
      {actions ? <div className="mt-2 flex flex-wrap items-center justify-center gap-3">{actions}</div> : null}
    </div>
  );
}
