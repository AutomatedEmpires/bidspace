import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { BidSpaceWordmark, Icon, buttonClasses } from "@bidspace/ui";

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/map", label: "Map" },
  { href: "/for-hosts", label: "For hosts" },
  { href: "/for-vendors", label: "For vendors" },
  { href: "/pricing", label: "Pricing" },
] as const;

export async function SiteHeader() {
  const { userId } = await auth();
  const signedIn = Boolean(userId);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-sm dark:bg-ink-deep/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="shrink-0 text-ink dark:text-canvas" aria-label="BidSpace home">
          <BidSpaceWordmark />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-muted transition-colors hover:text-ink dark:text-canvas-muted dark:hover:text-canvas"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {signedIn ? (
            <>
              <Link href="/dashboard" className={buttonClasses("secondary", "sm")}>
                Open workspace
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm font-medium text-ink-muted hover:text-ink dark:text-canvas-muted dark:hover:text-canvas">
                Sign in
              </Link>
              <Link href="/sign-up" className={buttonClasses("signal", "sm")}>
                List your space
              </Link>
            </>
          )}
        </div>

        {/* Mobile: disclosure menu, no JS required */}
        <details className="relative md:hidden">
          <summary
            className="flex size-10 cursor-pointer list-none items-center justify-center rounded-[3px] border border-line [&::-webkit-details-marker]:hidden"
            aria-label="Menu"
          >
            <Icon name="menu" size={20} />
          </summary>
          <div className="absolute right-0 top-12 z-50 w-64 rounded-[4px] border border-line bg-surface p-2 shadow-lg dark:bg-surface-dark">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-[3px] px-3 py-2.5 text-sm font-medium hover:bg-ink/[0.05] dark:hover:bg-canvas/[0.07]"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid gap-2 border-t border-line p-2">
              {signedIn ? (
                <Link href="/dashboard" className={buttonClasses("primary", "sm", "w-full")}>
                  Open workspace
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className={buttonClasses("secondary", "sm", "w-full")}>
                    Sign in
                  </Link>
                  <Link href="/sign-up" className={buttonClasses("signal", "sm", "w-full")}>
                    List your space
                  </Link>
                </>
              )}
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
