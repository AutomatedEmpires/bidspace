import type { Metadata } from "next";
import Link from "next/link";
import { Icon, buttonClasses } from "@bidspace/ui";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "BidSpace fees are not active. Future host-side listing, placement, promotion, or subscription plans remain under founder review.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="kicker mb-3">Pricing</p>
      <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.1]">
        Fees are not active.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-muted dark:text-canvas-muted">
        BidSpace is in founder preview. No vendor payment, host payout, listing fee, placement fee,
        promotion fee, or subscription is active. The commercial model will be approved before launch.
      </p>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {/* Vendors */}
        <div className="rounded-[4px] border border-line bg-surface p-7 dark:bg-surface-dark">
          <p className="kicker">Vendors</p>
          <p className="mt-3 font-display text-4xl font-semibold">Preview</p>
          <p className="mt-2 text-sm text-ink-muted dark:text-canvas-muted">
            No vendor charges are active.
          </p>
          <ul className="mt-6 grid gap-2.5 text-sm">
            {[
              "Map + list discovery",
              "Business profile & portfolio",
              "Explainable fit on every listing",
              "Sealed bids and applications",
              "Applications, bids, messaging",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Icon name="check" size={15} className="mt-0.5 shrink-0 text-moss dark:text-moss-bright" />
                {line}
              </li>
            ))}
          </ul>
          <Link href="/sign-up" className={buttonClasses("secondary", "md", "mt-7 w-full")}>
            Create a vendor account
          </Link>
        </div>

        {/* Marketplace */}
        <div className="relative rounded-[4px] border-2 border-signal bg-surface p-7 dark:bg-surface-dark">
          <span className="absolute -top-3 left-6 rounded-[3px] bg-signal px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
            Marketplace
          </span>
          <p className="kicker">Hosts</p>
          <p className="mt-3 font-display text-4xl font-semibold">
            TBD<span className="text-lg font-normal text-ink-muted dark:text-canvas-muted"> after founder review</span>
          </p>
          <p className="mt-2 text-sm text-ink-muted dark:text-canvas-muted">
            Future revenue is expected to come from hosts, not live vendor checkout.
          </p>
          <ul className="mt-6 grid gap-2.5 text-sm">
            {[
              "Locations, events, and reusable spaces",
              "All allocation modes, incl. sealed bidding",
              "Private vendor network & invitations",
              "Verification and requirement matching",
              "Recorded placement-review decisions",
              "Command center, calendar, submission review",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Icon name="check" size={15} className="mt-0.5 shrink-0 text-moss dark:text-moss-bright" />
                {line}
              </li>
            ))}
          </ul>
          <Link href="/sign-up" className={buttonClasses("signal", "md", "mt-7 w-full")}>
            List commercial space
          </Link>
        </div>

        {/* Enterprise */}
        <div className="rounded-[4px] border border-line bg-surface p-7 dark:bg-surface-dark">
          <p className="kicker">Future host plans</p>
          <p className="mt-3 font-display text-4xl font-semibold">Dormant</p>
          <p className="mt-2 text-sm text-ink-muted dark:text-canvas-muted">
            Commercial terms remain a founder decision.
          </p>
          <ul className="mt-6 grid gap-2.5 text-sm">
            {[
              "Possible listing fees",
              "Possible placement fees",
              "Possible promoted listings",
              "Possible host subscriptions",
              "No money movement before approval",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Icon name="check" size={15} className="mt-0.5 shrink-0 text-moss dark:text-moss-bright" />
                {line}
              </li>
            ))}
          </ul>
          <a href="mailto:hosts@bidspace.app" className={buttonClasses("secondary", "md", "mt-7 w-full")}>
            Share host feedback
          </a>
        </div>
      </div>

      <p className="mt-10 max-w-2xl text-sm text-ink-muted dark:text-canvas-muted">
        Any future promoted placement must be labeled. Payment can never buy verification,
        moderation outcomes, or trust standing. Final fees, refunds, and legal terms remain undecided.
      </p>
    </div>
  );
}
