import type { Metadata } from "next";
import Link from "next/link";
import { Icon, buttonClasses, type IconName } from "@bidspace/ui";

export const metadata: Metadata = {
  title: "For vendors — know where your business should go next",
  description:
    "Food trucks, makers, retailers, service businesses: discover real commercial positions, compete fairly, and build a record that compounds.",
};

const POINTS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "map",
    title: "See the whole market",
    body: "Booths, pads, kiosks, and placements near you — on a map, with dates, audience context, and real terms. Not who-you-know.",
  },
  {
    icon: "shield",
    title: "Fit you can read",
    body: "Every opportunity tells you whether you are eligible, whether the position matches your setup, and what to fix before applying.",
  },
  {
    icon: "bid",
    title: "Sealed, fair competition",
    body: "Your offer and your business go to the host. Competitors never see your number. Hosts select on fit, not just price.",
  },
  {
    icon: "vendor",
    title: "A profile that sells you",
    body: "Portfolio, categories, documents, and a review record grounded in completed bookings — hosts see the real business, instantly.",
  },
  {
    icon: "booking",
    title: "Operate without chaos",
    body: "Once booked: exact access, setup windows, host contacts, and the recorded terms — in one place, on your phone.",
  },
  {
    icon: "repeat",
    title: "Win once, get invited back",
    body: "Hosts keep networks of proven vendors. Every good booking raises your standing for the next release.",
  },
];

export default function ForVendorsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="kicker mb-3">For vendors</p>
      <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.1] sm:text-5xl">
        The best spots shouldn&apos;t go to whoever knew the organizer.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted dark:text-canvas-muted">
        BidSpace makes temporary commercial space a visible, competitive market — so the next
        position your business wins is the one it actually deserves.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/explore" className={buttonClasses("signal", "lg")}>
          <Icon name="explore" size={19} />
          Explore open opportunities
        </Link>
        <Link href="/sign-up" className={buttonClasses("secondary", "lg")}>
          Build your business profile
        </Link>
      </div>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {POINTS.map((point) => (
          <div key={point.title} className="rounded-[4px] border border-line bg-surface p-6 dark:bg-surface-dark">
            <Icon name={point.icon} size={24} className="text-plan dark:text-plan-bright" />
            <h2 className="mt-4 font-display text-lg font-semibold">{point.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-canvas-muted">{point.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-[4px] border border-line bg-ink p-8 text-canvas dark:bg-surface-dark sm:p-10">
        <p className="kicker !text-canvas-muted mb-2">Free where it matters</p>
        <h2 className="max-w-xl font-display text-2xl font-semibold">
          Discovery is never behind a paywall.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-canvas-muted">
          Browsing, fit, applying, and bidding are free for vendors. BidSpace earns a platform fee
          when bookings complete — our incentive is your booked calendar.
        </p>
      </div>
    </div>
  );
}
