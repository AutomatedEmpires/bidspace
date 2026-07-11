import type { Metadata } from "next";
import { Prose } from "@bidspace/ui";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What BidSpace collects, why, and the choices you have.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="kicker mb-3">Legal</p>
      <h1 className="font-display text-4xl font-semibold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink-muted dark:text-canvas-muted">
        Draft pending counsel review · Last updated July 2026
      </p>
      <Prose className="mt-8">
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account and organization data</strong> — name, email, organization details, and
            role profiles, via our authentication provider (Clerk).
          </li>
          <li>
            <strong>Marketplace activity</strong> — listings, bids, applications, bookings,
            messages, reviews, and the documents you upload (for example insurance certificates).
          </li>
          <li>
            <strong>Payment data</strong> — handled by Stripe. BidSpace never stores card numbers;
            we keep transaction records (amounts, fees, status) for the marketplace ledger.
          </li>
          <li>
            <strong>Usage data</strong> — product analytics (PostHog) and error diagnostics
            (Sentry) so we can fix what breaks and improve what matters.
          </li>
        </ul>

        <h2>What we use it for</h2>
        <ul>
          <li>Operating the marketplace: matching, bidding, booking, payment, and support.</li>
          <li>Trust and safety: verification, fraud prevention, dispute resolution.</li>
          <li>Product improvement, with analytics scoped to product events — not surveillance.</li>
          <li>Legal obligations, including tax and accounting records.</li>
        </ul>

        <h2>What we never do</h2>
        <ul>
          <li>Sell your personal information.</li>
          <li>Show your sealed bid amounts to competing bidders.</li>
          <li>Publish operational site details (gate codes, private contacts) on public pages.</li>
        </ul>

        <h2>Sharing</h2>
        <p>
          Marketplace counterparties see what commerce requires: a Host reviewing your bid sees
          your business profile and offer; a booked Vendor sees the Host&apos;s operational
          instructions. Service providers (Clerk, Supabase, Stripe, Cloudinary, PostHog, Sentry,
          Vercel) process data under their own agreements with us. We disclose data to authorities
          only when legally required.
        </p>

        <h2>Retention and deletion</h2>
        <p>
          Marketplace records (bookings, payments, reviews) are retained while the account exists
          and as required for legal and accounting purposes. You can request export or deletion of
          your personal data at privacy@bidspace.app; we will honor it within 30 days except where
          retention is legally required.
        </p>

        <h2>Contact</h2>
        <p>privacy@bidspace.app</p>
      </Prose>
    </div>
  );
}
