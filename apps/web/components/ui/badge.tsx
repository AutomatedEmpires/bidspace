import type { CSSProperties, ReactNode } from "react";

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.02em",
  background: "color-mix(in srgb, var(--foreground) 8%, transparent)",
};

export function Badge({ children }: { children: ReactNode }) {
  return <span style={badgeStyle}>{children}</span>;
}