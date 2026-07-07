import Link from "next/link";
import type { ReactNode } from "react";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { BidSpaceMark, Icon, cn, type IconName } from "@bidspace/ui";
import { NavLink } from "./nav-link";

export interface CockpitNavItem {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
  /** Show in the mobile bottom tab bar (max 5). */
  mobile?: boolean;
}

// One cockpit shell, three cockpits: vendor, host, admin get the layout that
// matches their job while sharing identity, tokens, and interaction language.
export function CockpitShell({
  navItems,
  cockpitLabel,
  accentClassName = "text-signal",
  children,
}: {
  navItems: CockpitNavItem[];
  cockpitLabel: string;
  accentClassName?: string;
  children: ReactNode;
}) {
  const mobileItems = navItems.filter((item) => item.mobile).slice(0, 5);

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface dark:bg-surface-dark lg:flex">
        <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
          <Link href="/" aria-label="BidSpace home" className={cn("shrink-0", accentClassName)}>
            <BidSpaceMark size={26} />
          </Link>
          <div className="leading-tight">
            <p className="font-display text-[15px] font-semibold">BidSpace</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted dark:text-canvas-muted">
              {cockpitLabel}
            </p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3" aria-label={`${cockpitLabel} navigation`}>
          <ul className="grid gap-0.5">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  exact={item.exact}
                  className="flex items-center gap-3 rounded-[3px] px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-ink/[0.05] hover:text-ink dark:text-canvas-muted dark:hover:bg-canvas/[0.06] dark:hover:text-canvas"
                  activeClassName="bg-ink/[0.06] !text-ink dark:bg-canvas/[0.08] dark:!text-canvas"
                >
                  <Icon name={item.icon} size={18} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
          <OrganizationSwitcher
            afterSelectOrganizationUrl="/dashboard"
            afterCreateOrganizationUrl="/onboarding"
          />
          <UserButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-canvas/95 px-4 backdrop-blur-sm dark:bg-ink-deep/95 lg:hidden">
          <Link href="/" className={cn("flex items-center gap-2", accentClassName)} aria-label="BidSpace home">
            <BidSpaceMark size={24} />
            <span className="font-display text-sm font-semibold text-ink dark:text-canvas">
              {cockpitLabel}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <OrganizationSwitcher
              afterSelectOrganizationUrl="/dashboard"
              afterCreateOrganizationUrl="/onboarding"
            />
            <UserButton />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:pb-8">
          {children}
        </main>

        {/* Mobile bottom tabs */}
        {mobileItems.length > 0 ? (
          <nav
            className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] dark:bg-surface-dark lg:hidden"
            aria-label={`${cockpitLabel} tabs`}
          >
            <ul className="grid" style={{ gridTemplateColumns: `repeat(${mobileItems.length}, 1fr)` }}>
              {mobileItems.map((item) => (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    exact={item.exact}
                    className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-ink-muted dark:text-canvas-muted"
                    activeClassName="!text-signal"
                  >
                    <Icon name={item.icon} size={21} />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
