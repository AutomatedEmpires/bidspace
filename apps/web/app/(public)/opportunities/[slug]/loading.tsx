import { Skeleton, SkeletonRows } from "@bidspace/ui";

export default function OpportunityLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Skeleton className="h-4 w-52" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-3 h-10 w-3/4" />
          <Skeleton className="mt-3 h-4 w-1/2" />
          <Skeleton className="mt-6 aspect-[16/7] w-full" />
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <div className="mt-10">
            <Skeleton className="h-6 w-56" />
            <SkeletonRows rows={3} className="mt-4" />
          </div>
        </div>
        <div className="grid content-start gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
