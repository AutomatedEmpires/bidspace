import type { Metadata } from "next";
import { Prose } from "@bidspace/ui";

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description: "What is never allowed on BidSpace.",
};

export default function AcceptableUsePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="kicker mb-3">Legal</p>
      <h1 className="font-display text-4xl font-semibold">Acceptable Use Policy</h1>
      <p className="mt-2 text-sm text-ink-muted dark:text-canvas-muted">
        Draft pending counsel review · Last updated July 2026
      </p>
      <Prose className="mt-8">
        <p>BidSpace exists for legitimate commerce in physical space. The following are never allowed:</p>

        <h2>Illegal or deceptive commerce</h2>
        <ul>
          <li>Listing space you have no right to offer, or space that does not exist.</li>
          <li>Selling illegal goods or services, or using bookings to facilitate illegal activity.</li>
          <li>Fake bids, shill bidding, coordinated bid manipulation, or fabricated demand.</li>
          <li>Fake reviews, review trading, or rating extortion.</li>
        </ul>

        <h2>Platform abuse</h2>
        <ul>
          <li>Scraping, harvesting contact data, or bulk unsolicited outreach.</li>
          <li>Circumventing fees by moving marketplace-originated transactions off-platform.</li>
          <li>Attempting to access other organizations&apos; private data or admin functions.</li>
          <li>Automation that degrades service for others.</li>
        </ul>

        <h2>Harmful conduct</h2>
        <ul>
          <li>Harassment, threats, or hate directed at any user or group.</li>
          <li>Discrimination against counterparties on legally protected characteristics.</li>
          <li>Publishing others&apos; private information (doxxing), including private site access details.</li>
        </ul>

        <p>
          Report violations from the listing or booking, or write to trust@bidspace.app. We act
          proportionally and record enforcement actions.
        </p>
      </Prose>
    </div>
  );
}
