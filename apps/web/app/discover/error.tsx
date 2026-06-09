"use client";

import Link from "next/link";

export default function DiscoverRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ width: "100%", maxWidth: 960, margin: "0 auto", padding: "32px 24px 56px" }}>
      <h1 style={{ fontSize: 40, marginBottom: 16 }}>Discovery route error</h1>
      <p style={{ lineHeight: 1.6, marginBottom: 16, opacity: 0.82 }}>
        The discovery surface hit an unexpected rendering error. Try the route again or return to the BidSpace home page.
      </p>
      {process.env.NODE_ENV === "production" ? null : (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            padding: 16,
            borderRadius: 16,
            background: "rgba(185, 28, 28, 0.08)",
            marginBottom: 16,
          }}
        >
          {error.message}
        </pre>
      )}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => reset()}
          style={{ borderRadius: 999, padding: "12px 18px", border: "1px solid var(--foreground)", background: "var(--foreground)", color: "var(--background)", fontWeight: 700 }}
        >
          Retry discovery
        </button>
        <Link href="/" style={{ borderRadius: 999, padding: "12px 18px", border: "1px solid rgba(127,127,127,0.24)" }}>
          Back home
        </Link>
      </div>
    </main>
  );
}