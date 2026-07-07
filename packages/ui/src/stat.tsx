import type { ReactNode } from "react";
import { cn } from "./cn";
import { Icon, type IconName } from "./icon";

// Action-first stat tile for command surfaces. The number is secondary to the
// job it demands — pair with an href so every stat is a doorway, not decor.
export function StatTile({
  label,
  value,
  icon,
  tone = "default",
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: IconName;
  tone?: "default" | "attention" | "positive";
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[4px] border border-line bg-surface p-4 dark:bg-surface-dark",
        tone === "attention" && "border-signal/40 bg-signal/[0.04]",
        tone === "positive" && "border-moss/40 bg-moss/[0.04]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted dark:text-canvas-muted">
          {label}
        </p>
        {icon ? (
          <Icon
            name={icon}
            size={16}
            className={cn(
              "text-ink-faint dark:text-canvas-faint",
              tone === "attention" && "text-signal",
              tone === "positive" && "text-moss",
            )}
          />
        ) : null}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums leading-none">{value}</p>
      {hint ? <p className="mt-2 text-xs text-ink-muted dark:text-canvas-muted">{hint}</p> : null}
    </div>
  );
}
