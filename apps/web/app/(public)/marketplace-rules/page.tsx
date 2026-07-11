import type { Metadata } from "next";
import { Prose } from "@bidspace/ui";

export const metadata: Metadata = {
  title: "Marketplace Rules",
  description: "The operating rules that keep BidSpace fair for hosts and vendors.",
};

export default function MarketplaceRulesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="kicker mb-3">Legal</p>
      <h1 className="font-display text-4xl font-semibold">Marketplace Rules</h1>
      <p className="mt-2 text-sm text-ink-muted dark:text-canvas-muted">
        Draft pending counsel review · Last updated July 2026
      </p>
      <Prose className="mt-8">
        <h2>For hosts</h2>
        <ul>
          <li>List only space and access you are authorized to offer.</li>
          <li>Describe positions accurately — dimensions, utilities, restrictions, audience estimates.</li>
          <li>State all commercial terms up front; no surprise fees after selection.</li>
          <li>Respond to bids and applications before your own stated deadlines.</li>
          <li>Honor awarded terms; the booking record is the agreement of reference.</li>
          <li>Provide the operational access a booked vendor needs to perform.</li>
        </ul>

        <h2>For vendors</h2>
        <ul>
          <li>Represent your business truthfully — categories, footprint, portfolio, documents.</li>
          <li>Bid only what you can honor; a submitted offer is a commitment if selected.</li>
          <li>Keep required documents current (insurance, permits) through the event date.</li>
          <li>Operate within the position and rules you booked.</li>
          <li>Review honestly, and only from real completed bookings.</li>
        </ul>

        <h2>Both sides</h2>
        <ul>
          <li>
            Keep marketplace transactions on the platform. Discovering a counterparty on BidSpace
            and closing off-platform to avoid fees is circumvention and risks suspension.
          </li>
          <li>Keep sensitive operational details out of public content.</li>
          <li>No discrimination on legally protected characteristics.</li>
          <li>Disputes start from the booking record; open one from the booking within 7 days of the issue.</li>
        </ul>

        <h2>Cancellations</h2>
        <p>
          Cancellation terms attach to each booking at award time. Absent specific terms: a vendor
          cancellation before payment releases the position with no penalty; after payment, refunds
          follow the host&apos;s stated policy on the listing. A host cancellation of a paid booking
          refunds the vendor in full. Either side may escalate to a dispute for platform review.
        </p>

        <h2>Enforcement</h2>
        <p>
          Violations are handled proportionally: warnings, listing removal, feature restriction,
          suspension. Admin actions are recorded. Appeals: support@bidspace.app.
        </p>
      </Prose>
    </div>
  );
}
