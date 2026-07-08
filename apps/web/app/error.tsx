"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, Icon, buttonClasses } from "@bidspace/ui";

// Recoverable route-segment error boundary. Renders inside the root layout, so
// it keeps the app chrome and offers a retry that preserves the user's place.
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry seam: when Sentry is wired (see docs/PRODUCTION-ACTIVATION.md §5),
    // report here — Sentry.captureException(error). Console keeps a trace today.
    console.error("Route error", error);
  }, [error]);

  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-alert/10 text-alert">
        <Icon name="warning" size={24} />
      </span>
      <div>
        <h1 className="font-display text-2xl font-semibold">Something went wrong</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted dark:text-canvas-muted">
          This part of BidSpace hit an unexpected error. Your work isn&apos;t lost — try again, or
          head back to your workspace.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-ink-faint dark:text-canvas-faint">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="signal" size="md" onClick={reset}>
          <Icon name="repeat" size={17} />
          Try again
        </Button>
        <Link href="/dashboard" className={buttonClasses("secondary", "md")}>
          Go to workspace
        </Link>
      </div>
    </main>
  );
}
