"use client";

import { useEffect } from "react";

// Last-resort boundary: catches errors in the root layout itself, so it must
// render its own <html>/<body> and cannot depend on app chrome or fonts.
// Inline styles keep it bulletproof even if the stylesheet failed to load.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry seam: report the root-level failure here once Sentry is wired
    // (Sentry.captureException(error)). See docs/PRODUCTION-ACTIVATION.md §5.
    console.error("Global error", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: 24,
          textAlign: "center",
          background: "#f6f4ee",
          color: "#16181d",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5d6370" }}>
          BidSpace
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>The marketplace hit a snag</h1>
        <p style={{ maxWidth: 440, color: "#5d6370", margin: 0, lineHeight: 1.6 }}>
          An unexpected error interrupted the page. Reloading usually clears it. If it persists,
          please try again shortly.
        </p>
        {error.digest ? (
          <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#979dab", margin: 0 }}>
            Reference: {error.digest}
          </p>
        ) : null}
        <button
          onClick={reset}
          style={{
            marginTop: 4,
            height: 40,
            padding: "0 20px",
            borderRadius: 3,
            border: "none",
            background: "#c63d12",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
