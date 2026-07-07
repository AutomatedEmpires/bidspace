import { Skeleton, SkeletonCard } from "@bidspace/ui";

export default function ExploreLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-9 w-72" />
      <Skeleton className="mt-8 h-[74px] w-full" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
