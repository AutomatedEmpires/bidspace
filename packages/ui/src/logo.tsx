import { cn } from "./cn";

// The BidSpace mark: a surveyed parcel with a claimed position — space
// becoming inventory. Drawn inline so it inherits currentColor everywhere.
export function BidSpaceMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M3.5 5.5 L20.5 3.5 L20.5 18.5 L3.5 20.5 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M3.5 5.5 L20.5 3.5 M12 4.5 L12 19.7" stroke="currentColor" strokeWidth="0.9" opacity="0.35" />
      <rect x="13.9" y="8.2" width="4.6" height="4.6" fill="var(--color-signal, #C63D12)" transform="rotate(-3 16.2 10.5)" />
    </svg>
  );
}

export function BidSpaceWordmark({ className, markSize = 26 }: { className?: string; markSize?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BidSpaceMark size={markSize} />
      <span className="font-display text-[1.25em] font-semibold tracking-[-0.02em] leading-none">
        BidSpace
      </span>
    </span>
  );
}
