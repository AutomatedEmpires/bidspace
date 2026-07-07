import { Skeleton, SkeletonRows } from "@bidspace/ui";

export default function HostLoading() {
  return (
    <div className="grid gap-8">
      <div>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-3 h-9 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[104px] w-full" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
      <SkeletonRows rows={3} />
    </div>
  );
}
