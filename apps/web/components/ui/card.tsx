import type { CSSProperties, ReactNode } from "react";

const cardStyle: CSSProperties = {
  border: "1px solid color-mix(in srgb, var(--foreground) 14%, transparent)",
  borderRadius: 20,
  background: "color-mix(in srgb, var(--background) 92%, var(--foreground) 8%)",
  padding: 20,
  boxShadow: "0 18px 40px rgba(0, 0, 0, 0.08)",
};

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <section style={{ ...cardStyle, ...style }}>{children}</section>;
}