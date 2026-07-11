import type { ReactNode } from "react";
import { cn } from "./cn";

export function PageHeader({
  kicker,
  title,
  lede,
  actions,
  className,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {kicker ? <p className="kicker mb-2">{kicker}</p> : null}
        <h1 className="font-display text-3xl font-semibold leading-[1.1] tracking-[-0.01em] sm:text-4xl">
          {title}
        </h1>
        {lede ? <p className="mt-3 text-[15px] leading-relaxed text-ink-muted dark:text-canvas-muted">{lede}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}
