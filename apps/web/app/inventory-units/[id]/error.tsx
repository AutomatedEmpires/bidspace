"use client";

import Link from "next/link";

export default function InventoryUnitError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="state-shell">
      <div className="error-panel">
        <p className="eyebrow">Unit unavailable</p>
        <h1>This inventory unit could not load.</h1>
        <p>Try again or return to discovery to keep browsing available units.</p>
        <div className="filter-actions">
          <button type="button" className="button button-primary" onClick={reset}>Try again</button>
          <Link href="/discover" className="button button-ghost">Back to discovery</Link>
        </div>
      </div>
    </main>
  );
}
