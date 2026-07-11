import type { Metadata } from "next";
import Link from "next/link";
import { Icon, buttonClasses, type IconName } from "@bidspace/ui";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "The BidSpace loop: create supply, publish opportunity, discover, qualify, bid or apply, select, book, operate, review, repeat.",
};

const LOOP: { icon: IconName; title: string; body: string; side: "host" | "vendor" | "both" }[] = [
  { icon: "venue", title: "Create supply", body: "A host defines a location and its inventory units — booths, pads, kiosks, placements. They persist forever.", side: "host" },
  { icon: "opportunity", title: "Publish opportunity", body: "Inventory is released for specific dates with terms, requirements, and visibility: public, network, or invite-only.", side: "host" },
  { icon: "explore", title: "Discover", body: "Vendors find positions on the map and in the list, with real audience context and real terms.", side: "vendor" },
  { icon: "shield", title: "Qualify", body: "Explainable fit shows eligibility, operational match, and anything to fix before applying. No black-box scores.", side: "vendor" },
  { icon: "bid", title: "Bid or apply", body: "Sealed offers with the business behind them — portfolio, categories, documents. Competitors never see your number.", side: "vendor" },
  { icon: "check", title: "Select", body: "The host reviews fit, shortlists, counters, and awards. The highest bid does not auto-win.", side: "host" },
  { icon: "money", title: "Book & pay", body: "Award creates a booking with the accepted terms snapshotted. Payment runs through Stripe; the host's payout routes automatically.", side: "both" },
  { icon: "booking", title: "Operate", body: "Access instructions, setup windows, and host contacts unlock to the booked vendor — never on public pages.", side: "both" },
  { icon: "review", title: "Review & repeat", body: "Reviews come only from completed bookings. Good vendors get invited back; good hosts fill faster next season.", side: "both" },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <p className="kicker mb-3">How it works</p>
      <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.1]">
        One loop, from empty space to repeat revenue.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-muted dark:text-canvas-muted">
        BidSpace runs the whole lifecycle of temporary commercial access — so nothing lives in
        PDFs, spreadsheets, or somebody&apos;s inbox.
      </p>

      <ol className="mt-12 grid gap-px overflow-hidden rounded-[4px] border border-line bg-line">
        {LOOP.map((step, i) => (
          <li key={step.title} className="grid gap-3 bg-surface p-6 dark:bg-surface-dark sm:grid-cols-[56px_1fr_120px] sm:items-center">
            <span className="flex size-11 items-center justify-center rounded-[4px] bg-ink/[0.05] text-signal dark:bg-canvas/[0.07]">
              <Icon name={step.icon} size={22} />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold">
                <span className="mr-2 text-ink-faint dark:text-canvas-faint">0{i + 1}</span>
                {step.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted dark:text-canvas-muted">{step.body}</p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-faint dark:text-canvas-faint sm:text-right">
              {step.side === "both" ? "Both sides" : step.side === "host" ? "Host" : "Vendor"}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/for-hosts" className={buttonClasses("signal", "lg")}>
          I control space
        </Link>
        <Link href="/for-vendors" className={buttonClasses("secondary", "lg")}>
          I need space
        </Link>
      </div>
    </div>
  );
}
