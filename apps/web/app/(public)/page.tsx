import Link from "next/link";
import type { Metadata } from "next";
import { listPublicOpportunities, type PublicOpportunity } from "@bidspace/services";
import { Icon, buttonClasses, type IconName } from "@bidspace/ui";
import { HeroPlan } from "@/components/hero-plan";
import { OpportunityCard } from "@/components/opportunity-card";
import { tryGetDb } from "@/lib/safe-db";

export const metadata: Metadata = {
  title: "BidSpace — Every space can become an opportunity",
  description:
    "Hosts publish temporary vendor spaces; vendors discover them, bid or apply, and build repeat relationships.",
};

export const revalidate = 300;

async function getLiveOpportunities(): Promise<PublicOpportunity[]> {
  const db = tryGetDb();
  if (!db) return [];
  try {
    return await listPublicOpportunities(db, { limit: 6 });
  } catch {
    return [];
  }
}

const HOST_STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "venue",
    title: "One location",
    body: "Add the fairground, market, lot, venue, or district you control — once.",
  },
  {
    icon: "inventory",
    title: "Many reusable spaces",
    body: "Booth A12, the north food-truck pad, kiosk 3, the banner placement. Reuse each one season after season.",
  },
  {
    icon: "opportunity",
    title: "Released for vendors",
    body: "Publish dates, traffic, terms, and requirements. Use bids, applications, invitations, approval, or a waitlist.",
  },
  {
    icon: "check",
    title: "Curated placements",
    body: "Compare the business behind each submission, shortlist, message, approve, decline, or waitlist.",
  },
];

const VENDOR_POINTS: { icon: IconName; text: string }[] = [
  { icon: "map", text: "Map-first discovery of booths, pads, kiosks, and placements near you" },
  { icon: "shield", text: "Explainable fit — see exactly why a spot works for your business" },
  { icon: "bid", text: "Bid or apply with your real portfolio, not a PDF emailed into the void" },
  { icon: "repeat", text: "Win once, get invited back — hosts keep their proven vendors close" },
];

export default async function HomePage() {
  const live = await getLiveOpportunities();

  return (
    <>
      {/* HERO — physical space becoming commercial inventory */}
      <section className="plan-grid relative overflow-hidden border-b border-line text-ink dark:text-canvas">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <p className="kicker mb-4">The marketplace for temporary commercial space</p>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.015em] sm:text-5xl lg:text-[3.4rem]">
              Every space can become an&nbsp;opportunity.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-muted dark:text-canvas-muted">
              Vendor booths, food-truck pads, kiosks, parking rows, sponsor placements. BidSpace
              turns the commercial capacity of real places into spaces that vendors can
              discover, bid on, or apply for.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/explore" className={buttonClasses("signal", "lg")}>
                <Icon name="explore" size={20} />
                Explore spaces
              </Link>
              <Link href="/for-hosts" className={buttonClasses("secondary", "lg")}>
                <Icon name="venue" size={20} />
                List commercial space
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-ink-muted dark:text-canvas-muted">
              <Icon name="shield" size={16} className="text-moss" />
              Founder preview: no payments or binding placements are active.
            </p>
          </div>
          <div className="justify-self-center md:justify-self-end">
            <HeroPlan />
          </div>
        </div>
      </section>

      {/* PREVIEW SUPPLY */}
      {live.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="kicker mb-2">Marketplace preview</p>
              <h2 className="font-display text-3xl font-semibold">Spaces accepting interest</h2>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1 text-sm font-semibold text-signal-deep hover:underline dark:text-signal-bright"
            >
              View all <Icon name="arrowRight" size={16} />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        </section>
      ) : null}

      {/* HOST NARRATIVE */}
      <section className="border-y border-line bg-ink text-canvas dark:bg-surface-dark">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="kicker !text-canvas-muted mb-2">For hosts</p>
          <h2 className="max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
            One location. Reusable spaces. Stronger vendor relationships.
          </h2>
          <p className="mt-4 max-w-2xl text-canvas-muted">
            Stop rebuilding your vendor world every season in spreadsheets, PDFs, and inbox
            threads. Define your commercial positions once, release them whenever you like, and
            keep the vendors who perform.
          </p>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[4px] border border-canvas/15 bg-canvas/15 sm:grid-cols-2 lg:grid-cols-4">
            {HOST_STEPS.map((step, i) => (
              <div key={step.title} className="bg-ink p-6 dark:bg-surface-dark">
                <div className="flex items-center justify-between">
                  <Icon name={step.icon} size={24} className="text-signal-bright" />
                  <span className="font-display text-sm text-canvas-faint">0{i + 1}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-canvas-muted">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/for-hosts" className={buttonClasses("signal", "md")}>
              See the host workspace
            </Link>
            <Link href="/sign-up" className={buttonClasses("secondary", "md", "!border-canvas/40 !text-canvas hover:!border-canvas hover:!bg-canvas/10")}>
              Create your first space listing
            </Link>
          </div>
        </div>
      </section>

      {/* VENDOR NARRATIVE */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2">
        <div>
          <p className="kicker mb-2">For vendors</p>
          <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Know where your business should go next.
          </h2>
          <p className="mt-4 text-ink-muted dark:text-canvas-muted">
            The best spots have always gone to whoever knew the organizer. BidSpace makes the
            market visible: real positions, real audience context, real terms — and a fair way to
            compete for them.
          </p>
          <ul className="mt-8 grid gap-4">
            {VENDOR_POINTS.map((point) => (
              <li key={point.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[3px] bg-plan/10 text-plan dark:bg-plan/25 dark:text-plan-bright">
                  <Icon name={point.icon} size={17} />
                </span>
                <p className="text-[15px] leading-relaxed">{point.text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link href="/for-vendors" className={buttonClasses("primary", "md")}>
              How vendors win on BidSpace
            </Link>
          </div>
        </div>

        {/* Fit illustration */}
        <div className="rounded-[4px] border border-line bg-surface p-6 dark:bg-surface-dark">
          <p className="kicker mb-4">Fit, explained</p>
          <div className="grid gap-3">
            <p className="font-display text-xl font-semibold text-moss dark:text-moss-bright">
              Strong fit
            </p>
            {[
              "Food vendor accepted",
              "Your 10×10 footprint fits",
              "Power requirement supported",
              "Inside your travel range",
            ].map((line) => (
              <p key={line} className="flex items-center gap-2.5 text-sm">
                <Icon name="check" size={16} className="text-moss dark:text-moss-bright" />
                {line}
              </p>
            ))}
            <div className="mt-2 rounded-[3px] border border-signal/30 bg-signal/[0.06] p-3">
              <p className="flex items-start gap-2 text-sm">
                <Icon name="warning" size={16} className="mt-0.5 shrink-0 text-signal" />
                <span>
                  <strong className="font-semibold">Review before applying:</strong> your insurance
                  certificate expires before the event date.
                </span>
              </p>
            </div>
            <p className="mt-1 text-xs text-ink-muted dark:text-canvas-muted">
              Reasons, not a black-box score.
            </p>
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="border-t border-line">
        <div className="plan-grid mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Physical commercial access is inventory.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-muted dark:text-canvas-muted">
            BidSpace makes it discoverable, competitive, curated, and repeatable.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/explore" className={buttonClasses("signal", "lg")}>
              Explore spaces
            </Link>
            <Link href="/for-hosts" className={buttonClasses("secondary", "lg")}>
              List commercial space
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
