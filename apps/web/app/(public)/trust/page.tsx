import type { Metadata } from "next";
import { Icon, type IconName } from "@bidspace/ui";

export const metadata: Metadata = {
  title: "Trust & verification",
  description:
    "How BidSpace earns trust: provenance-based verification, reviews grounded in completed bookings, recorded terms, and money handled by Stripe.",
};

const SIGNALS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "verified",
    title: "Verification with provenance",
    body: "No single magic checkmark. Each signal names what was verified and why we know it: organization identity, payout account readiness, current insurance, marketplace history.",
  },
  {
    icon: "review",
    title: "Reviews that mean something",
    body: "Only parties to a completed booking can review each other. No drive-by ratings, no anonymous spam, no purchased stars.",
  },
  {
    icon: "document",
    title: "Recorded terms",
    body: "When a bid is awarded, the accepted terms are snapshotted onto the booking. Later edits never silently rewrite what both sides agreed to.",
  },
  {
    icon: "money",
    title: "Money moves through Stripe",
    body: "Payments run on Stripe Connect. BidSpace never holds your card details; host payouts route automatically with the platform fee disclosed.",
  },
  {
    icon: "shield",
    title: "Progressive disclosure",
    body: "Public pages carry marketing information. Gate codes, load-in instructions, and staff contacts unlock only to the vendor whose booking is confirmed.",
  },
  {
    icon: "alert",
    title: "Real moderation",
    body: "Disputes, reports, and verification are handled by platform operators with an audit trail — admin actions are recorded, not vibes.",
  },
];

export default function TrustPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <p className="kicker mb-3">Trust</p>
      <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.1]">
        Trust is earned per claim, not granted per badge.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-muted dark:text-canvas-muted">
        Commerce between strangers needs receipts. Here is exactly where ours come from.
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {SIGNALS.map((signal) => (
          <div key={signal.title} className="rounded-[4px] border border-line bg-surface p-6 dark:bg-surface-dark">
            <Icon name={signal.icon} size={24} className="text-moss dark:text-moss-bright" />
            <h2 className="mt-4 font-display text-lg font-semibold">{signal.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-canvas-muted">{signal.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-ink-muted dark:text-canvas-muted">
        Something looks wrong? Report it from the listing or booking — reports land directly in the
        operations queue.
      </p>
    </div>
  );
}
