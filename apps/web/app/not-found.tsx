import Link from "next/link";
import { BidSpaceWordmark, Icon, buttonClasses } from "@bidspace/ui";

export default function NotFound() {
  return (
    <main className="plan-grid flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center text-ink dark:text-canvas">
      <Link href="/" aria-label="BidSpace home">
        <BidSpaceWordmark />
      </Link>
      <div>
        <p className="kicker mb-2">404</p>
        <h1 className="font-display text-3xl font-semibold">This space isn&apos;t on the map</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-muted dark:text-canvas-muted">
          The opportunity may have closed, been filled, or moved. The marketplace is still open —
          keep exploring.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/explore" className={buttonClasses("signal", "md")}>
          <Icon name="explore" size={18} />
          Explore opportunities
        </Link>
        <Link href="/" className={buttonClasses("secondary", "md")}>
          Back home
        </Link>
      </div>
    </main>
  );
}
