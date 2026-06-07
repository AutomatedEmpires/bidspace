"use client";

import Link from "next/link";

export default function DiscoverError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="state-shell">
      <div className="error-panel">
        <p className="eyebrow">Discovery unavailable</p>
        <h1>Inventory search could not load.</h1>
        <p>
          This route needs the Supabase-backed discovery service. Check runtime configuration or try again with a simpler query.
        </p>
        <div className="filter-actions">
          <button type="button" className="button button-primary" onClick={reset}>Try again</button>
          <Link href="/discover" className="button button-ghost">Reset discovery</Link>
        </div>
      </div>
    </main>
  );
}
