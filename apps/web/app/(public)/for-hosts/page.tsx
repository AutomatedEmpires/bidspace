import type { Metadata } from "next";
import Link from "next/link";
import { Icon, buttonClasses, type IconName } from "@bidspace/ui";

export const metadata: Metadata = {
  title: "For hosts — turn space into revenue",
  description:
    "Fairs, markets, venues, municipalities, property owners: define your commercial inventory once and release it season after season.",
};

const CAPABILITIES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "inventory",
    title: "An inventory control plane",
    body: "Booth A12 exists once, forever. Release it for the spring market, the summer fair, and next year — without rebuilding your world each time.",
  },
  {
    icon: "network",
    title: "Your private vendor network",
    body: "Start with the vendors you already trust. Invite them, run private releases, send direct offers — the public marketplace is an expansion, not a requirement.",
  },
  {
    icon: "bid",
    title: "Selection on your terms",
    body: "Fixed price, applications, sealed competitive bids, direct offers, invitation-only. You choose the allocation mode; the highest number never auto-wins.",
  },
  {
    icon: "shield",
    title: "Founder-gated commitments",
    body: "Preview decisions are recorded for product testing, while payments and binding placements remain disabled until separately approved.",
  },
  {
    icon: "command",
    title: "A command center, not a dashboard",
    body: "Your home screen answers one question: what needs my decision? Bids and applications waiting, invitations open, deadlines closing.",
  },
  {
    icon: "calendar",
    title: "Time as a first-class dimension",
    body: "Events, releases, and bookings on one calendar. You always know what space is available when.",
  },
];

export default function ForHostsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="kicker mb-3">For hosts</p>
      <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.1] sm:text-5xl">
        You already own the audience. Now operate the inventory.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted dark:text-canvas-muted">
        Every fair, market, venue, and district manages vendor space through some mix of PDF
        applications, spreadsheets, and phone calls. BidSpace replaces that mix with an operating
        system — and turns your recurring space into recurring, competitive revenue.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/sign-up" className={buttonClasses("signal", "lg")}>
          Create your first space listing
        </Link>
        <Link href="/how-it-works" className={buttonClasses("secondary", "lg")}>
          See the full loop
        </Link>
      </div>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((capability) => (
          <div key={capability.title} className="rounded-[4px] border border-line bg-surface p-6 dark:bg-surface-dark">
            <Icon name={capability.icon} size={24} className="text-signal" />
            <h2 className="mt-4 font-display text-lg font-semibold">{capability.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-canvas-muted">
              {capability.body}
            </p>
          </div>
        ))}
      </div>

      <div className="plan-grid mt-16 rounded-[4px] border border-line p-8 sm:p-10">
        <p className="kicker mb-2">The activation moment</p>
        <h2 className="max-w-xl font-display text-2xl font-semibold">
          Host → venue or event → reusable space → dated listing → vendor submissions.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted dark:text-canvas-muted">
          No enterprise configuration before you understand the product. Add one location, define
          one position, publish one release — grow from there.
        </p>
        <Link href="/sign-up" className={buttonClasses("primary", "md", "mt-6")}>
          Start now — it takes minutes
        </Link>
      </div>
    </div>
  );
}
