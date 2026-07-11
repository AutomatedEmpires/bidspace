import { cn } from "./cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-[3px] bg-ink/[0.07] dark:bg-canvas/[0.09]", className)}
    />
  );
}

// Route-shaped building blocks — compose these into per-route loading.tsx files.
export function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[4px] border border-line p-5", className)}>
      <Skeleton className="mb-3 h-32 w-full" />
      <Skeleton className="mb-2 h-4 w-2/3" />
      <Skeleton className="mb-2 h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-[4px] border border-line p-4">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="grid w-full gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}
