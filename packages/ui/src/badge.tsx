import type { ReactNode } from "react";
import { cn } from "./cn";
import { statusLabel, statusTone, type StatusTone } from "./status";

const TONE_CLASSES: Record<StatusTone, string> = {
  positive: "bg-moss/10 text-moss dark:bg-moss/20 dark:text-moss-bright",
  active: "bg-plan/10 text-plan dark:bg-plan/25 dark:text-plan-bright",
  attention: "bg-signal/10 text-signal-deep dark:bg-signal/20 dark:text-signal-bright",
  negative: "bg-alert/10 text-alert dark:bg-alert/20 dark:text-alert-bright",
  neutral: "bg-ink/[0.07] text-ink-muted dark:bg-canvas/10 dark:text-canvas-muted",
};

export interface BadgeProps {
  tone?: StatusTone;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = "neutral", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// Renders any marketplace status with the canonical tone mapping.
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={statusTone(status)} className={className}>
      {statusLabel(status)}
    </Badge>
  );
}
