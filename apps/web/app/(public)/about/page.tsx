import type { Metadata } from "next";
import Link from "next/link";
import { Prose, buttonClasses } from "@bidspace/ui";

export const metadata: Metadata = {
  title: "About",
  description: "BidSpace turns physical commercial access into programmable inventory.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="kicker mb-3">About</p>
      <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.1]">
        Physical commercial access is the last unstructured marketplace.
      </h1>
      <Prose className="mt-8">
        <p>
          The world is full of valuable commercial capacity that barely exists online: the vendor
          rows at a county fair, the food-truck pad outside a stadium, the kiosk on a mall
          concourse, the banner position over a festival entrance, the Saturday stall at a farmers
          market that has had a waiting list since 2019.
        </p>
        <p>
          Today that capacity is managed through PDF applications, spreadsheets, phone calls, and
          private relationships. Good vendors miss opportunities they never heard about. Good hosts
          leave money on the table and rebuild the same vendor list every season.
        </p>
        <p>
          <strong>BidSpace is the operating marketplace for that capacity.</strong> Hosts define
          their locations and inventory units once, release them as opportunities on their own
          terms, and manage discovery, bidding, selection, booking, payment, and history from one
          system. Vendors get a visible market, a fair way to compete, and a record that compounds.
        </p>
        <p>
          BidSpace is built by AutomatedEmpires in the Pacific Northwest, starting with the
          markets, fairs, and venues of the Inland Northwest and expanding city by city.
        </p>
      </Prose>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/for-hosts" className={buttonClasses("signal", "md")}>
          List commercial space
        </Link>
        <Link href="/explore" className={buttonClasses("secondary", "md")}>
          Explore opportunities
        </Link>
      </div>
    </div>
  );
}
