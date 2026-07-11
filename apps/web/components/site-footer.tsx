import Link from "next/link";
import { BidSpaceWordmark } from "@bidspace/ui";

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Marketplace",
    links: [
      { href: "/explore", label: "Explore opportunities" },
      { href: "/map", label: "Map view" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/trust", label: "Trust & verification" },
    ],
  },
  {
    heading: "For hosts",
    links: [
      { href: "/for-hosts", label: "List commercial space" },
      { href: "/pricing", label: "Pricing" },
      { href: "/sign-up", label: "Create a host account" },
    ],
  },
  {
    heading: "For vendors",
    links: [
      { href: "/for-vendors", label: "Find your next spot" },
      { href: "/sign-up", label: "Create a vendor account" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy" },
      { href: "/marketplace-rules", label: "Marketplace rules" },
      { href: "/acceptable-use", label: "Acceptable use" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ink text-canvas dark:bg-ink-deep">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <BidSpaceWordmark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-canvas-muted">
              The operating marketplace for temporary commercial space, access, placement, and
              opportunity.
            </p>
          </div>
          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h3 className="kicker !text-canvas-muted">{column.heading}</h3>
              <ul className="mt-4 grid gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-canvas-soft transition-colors hover:text-canvas"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-canvas/15 pt-6 text-xs text-canvas-muted">
          <p>© {new Date().getFullYear()} BidSpace, an AutomatedEmpires venture.</p>
          <p>Every space can become an opportunity.</p>
        </div>
      </div>
    </footer>
  );
}
