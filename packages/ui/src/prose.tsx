import type { ReactNode } from "react";
import { cn } from "./cn";

// Editorial/legal typographic container. Styles nested headings, paragraphs,
// and lists without requiring a typography plugin.
export function Prose({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "max-w-3xl text-[15px] leading-[1.75] text-ink dark:text-canvas",
        "[&_h2]:font-display [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight",
        "[&_h3]:font-display [&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold",
        "[&_p]:mb-4 [&_p]:text-ink-soft dark:[&_p]:text-canvas-soft",
        "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1.5 [&_li]:text-ink-soft dark:[&_li]:text-canvas-soft",
        "[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_strong]:font-semibold [&_strong]:text-ink dark:[&_strong]:text-canvas",
        "[&_a]:underline [&_a]:decoration-signal/50 [&_a]:underline-offset-2 hover:[&_a]:decoration-signal",
        className,
      )}
    >
      {children}
    </div>
  );
}
