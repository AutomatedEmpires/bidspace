import Link from "next/link";
import type { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { BidSpaceWordmark, Icon } from "@bidspace/ui";

// Messages serve both cockpits, so they get a light neutral shell with a way
// back to whichever workspace the user came from.
export default function MessagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur-sm dark:bg-ink-deep/95">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="BidSpace home" className="text-ink dark:text-canvas">
              <BidSpaceWordmark markSize={22} className="text-[13px]" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink dark:text-canvas-muted dark:hover:text-canvas"
            >
              <Icon name="caretLeft" size={14} />
              Workspace
            </Link>
          </div>
          <UserButton />
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
