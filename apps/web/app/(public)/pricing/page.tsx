import type { Metadata } from "next";
import Link from "next/link";
import { Icon, buttonClasses } from "@bidspace/ui";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Vendors discover and bid free. Hosts pay a platform fee on completed bookings, with subscriptions for recurring operations coming next.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="kicker mb-3">Pricing</p>
      <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.1]">
        We earn when your space earns.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-muted dark:text-canvas-muted">
        No listing fees, no charge to browse or bid. BidSpace takes a platform fee when a booking
        completes through the marketplace — aligned with hosts filling space and vendors booking it.
      </p>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {/* Vendors */}
        <div className="rounded-[4px] border border-line bg-surface p-7 dark:bg-surface-dark">
          <p className="kicker">Vendors</p>
          <p className="mt-3 font-display text-4xl font-semibold">Free</p>
          <p className="mt-2 text-sm text-ink-muted dark:text-canvas-muted">
            Core discovery is never paywalled.
          </p>
          <ul className="mt-6 grid gap-2.5 text-sm">
            {[
              "Map + list discovery",
              "Business profile & portfolio",
              "Explainable fit on every listing",
              "Sealed bids and applications",
              "Bookings, messaging, reviews",
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
            10%<span className="text-lg font-normal text-ink-muted dark:text-canvas-muted"> per completed booking</span>
          </p>
          <p className="mt-2 text-sm text-ink-muted dark:text-canvas-muted">
            Withheld automatically from the payout — you never invoice us.
          </p>
          <ul className="mt-6 grid gap-2.5 text-sm">
            {[
              "Unlimited locations & inventory units",
              "All allocation modes, incl. sealed bidding",
              "Private vendor network & invitations",
              "Stripe payments with automatic payouts",
              "Recorded terms on every booking",
              "Command center, calendar, bid review",
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
          <p className="kicker">Enterprise</p>
          <p className="mt-3 font-display text-4xl font-semibold">Let&apos;s talk</p>
          <p className="mt-2 text-sm text-ink-muted dark:text-canvas-muted">
            Municipalities, venue portfolios, large operators.
          </p>
          <ul className="mt-6 grid gap-2.5 text-sm">
            {[
              "Multi-venue and multi-event operations",
              "Team roles & approval workflows",
              "Negotiated marketplace terms",
              "Priority verification & support",
              "Integrations & reporting",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Icon name="check" size={15} className="mt-0.5 shrink-0 text-moss dark:text-moss-bright" />
                {line}
              </li>
            ))}
          </ul>
          <a href="mailto:hosts@bidspace.app" className={buttonClasses("secondary", "md", "mt-7 w-full")}>
            Contact us
          </a>
        </div>
      </div>

      <p className="mt-10 max-w-2xl text-sm text-ink-muted dark:text-canvas-muted">
        Promoted placement, when offered, is always labeled as such. Money never buys verification,
        moderation outcomes, or trust standing on BidSpace.
      </p>
    </div>
  );
}
