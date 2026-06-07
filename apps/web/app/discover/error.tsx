"use client";

import { useEffect } from "react";

export default function DiscoverError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Discover route error", error);
  }, [error]);

  return (
    <main className="page-shell discover">
      <div className="empty-state">
        <p className="empty-state__title">Something went wrong while loading discovery</p>
        <p className="empty-state__body">
          This is usually temporary. You can retry, or adjust your filters and search
          again.
        </p>
        <button type="button" className="button button--primary" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </main>
  );
}
