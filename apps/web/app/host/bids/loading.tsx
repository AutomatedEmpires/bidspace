import { Skeleton, SkeletonRows } from "@bidspace/ui";

export default function HostBidsLoading() {
  return (
    <div className="grid gap-8">
      <div>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-9 w-80 max-w-full" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </div>
      <SkeletonRows rows={4} />
    </div>
  );
}
