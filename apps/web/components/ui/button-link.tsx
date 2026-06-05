import type { CSSProperties, ReactNode } from "react";

const buttonLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  padding: "12px 18px",
  fontSize: 14,
  fontWeight: 700,
  background: "var(--foreground)",
  color: "var(--background)",
  border: "1px solid var(--foreground)",
};

export function ButtonLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} style={buttonLinkStyle}>
      {children}
    </a>
  );
}