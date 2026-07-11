import type { ReactNode } from "react";
import { cn } from "./cn";

// The standard BidSpace surface: flat, 1px drafting line, small radius.
// Deliberately not a drop-shadow card — the visual language is architectural.
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-[4px] border border-line bg-surface dark:bg-surface-dark", className)}>
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  kicker,
  actions,
  className,
}: {
  title: ReactNode;
  kicker?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-line px-5 py-4", className)}>
      <div>
        {kicker ? <p className="kicker mb-1">{kicker}</p> : null}
        <h2 className="font-display text-lg font-semibold leading-tight">{title}</h2>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PanelBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}
