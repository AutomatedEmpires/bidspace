import type { Metadata } from "next";
import { Prose } from "@bidspace/ui";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The agreement governing use of the BidSpace marketplace.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="kicker mb-3">Legal</p>
      <h1 className="font-display text-4xl font-semibold">Terms of Service</h1>
      <p className="mt-2 text-sm text-ink-muted dark:text-canvas-muted">
        Draft pending counsel review · Last updated July 2026
      </p>
      <Prose className="mt-8">
        <h2>1. What BidSpace is</h2>
        <p>
          BidSpace is a marketplace platform that lets organizations that control physical
          commercial space, access, or placement (&quot;Hosts&quot;) list that capacity as inventory and
          opportunities, and lets businesses (&quot;Vendors&quot;) discover, apply or bid for, and book it.
          BidSpace is the platform operator. BidSpace is not a party to the commercial relationship
          between a Host and a Vendor, does not own or control listed spaces, and does not employ
          either side.
        </p>

        <h2>2. Accounts and organizations</h2>
        <p>
          You act on BidSpace through an organization. You are responsible for the accuracy of your
          organization&apos;s information, for the actions of members you invite, and for keeping your
          credentials secure. You must be authorized to bind the organization you represent.
        </p>

        <h2>3. Listings and accuracy</h2>
        <p>
          Hosts are responsible for the accuracy of their listings: location, dimensions,
          utilities, audience estimates, dates, requirements, and price terms. Attendance and
          traffic figures must be good-faith estimates and labeled as estimates. Misleading
          listings may be removed and repeat misrepresentation may lead to suspension.
        </p>

        <h2>4. Bids, applications, and awards</h2>
        <p>
          Submitting a bid or application is a commitment to honor its terms if selected before its
          expiry. Hosts select at their discretion; the highest bid is not automatically the
          winner. When a Host accepts a bid, the accepted terms are recorded on the resulting
          booking and both parties are expected to perform against that record.
        </p>

        <h2>5. Bookings and payment</h2>
        <p>
          Payments for marketplace bookings are processed by Stripe. BidSpace charges a platform
          fee on completed bookings, which is disclosed before commitment and withheld from the
          Host payout. BidSpace does not hold funds in escrow. Refunds and cancellation outcomes
          follow the cancellation terms attached to the booking and the Marketplace Rules.
        </p>

        <h2>6. Off-platform circumvention</h2>
        <p>
          Using BidSpace to discover a counterparty and then moving the transaction off-platform to
          avoid fees deprives the marketplace of the record, protections, and history both sides
          rely on, and violates these terms. Long-standing relationships that predate BidSpace are
          not restricted.
        </p>

        <h2>7. Reviews and content</h2>
        <p>
          Reviews may only be left by parties to a completed booking and must reflect genuine
          experience. You grant BidSpace a license to display content you post (listings, profiles,
          reviews, images) for operating and promoting the marketplace. Do not post content you
          have no right to share.
        </p>

        <h2>8. Compliance</h2>
        <p>
          Hosts and Vendors are each responsible for their own legal compliance: permits, food
          safety, insurance, fire codes, tax collection and reporting, accessibility, and local
          regulations. BidSpace may require evidence of compliance (for example a certificate of
          insurance) but verification of a document is not legal advice and not a guarantee.
        </p>

        <h2>9. Suspension and termination</h2>
        <p>
          We may suspend or restrict accounts that violate these terms, the Marketplace Rules, or
          the Acceptable Use Policy, or that create risk for other users. Where practical we will
          explain the action and how to appeal. You may close your account at any time; obligations
          from existing bookings survive closure.
        </p>

        <h2>10. Disclaimers and liability</h2>
        <p>
          BidSpace is provided &quot;as is&quot;. To the maximum extent permitted by law, BidSpace disclaims
          implied warranties and is not liable for indirect or consequential damages, or for the
          acts or omissions of Hosts or Vendors. Our aggregate liability for claims relating to the
          platform is limited to the platform fees you paid to BidSpace in the twelve months before
          the claim.
        </p>

        <h2>11. Changes</h2>
        <p>
          We will notify account owners of material changes to these terms at least 14 days before
          they take effect. Continued use after the effective date is acceptance.
        </p>

        <h2>12. Contact</h2>
        <p>
          BidSpace, an AutomatedEmpires venture · legal@bidspace.app
        </p>
      </Prose>
    </div>
  );
}
