import type { CSSProperties, ReactNode } from "react";

const shellStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1120,
  margin: "0 auto",
  padding: "32px 24px 56px",
};

const heroStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 24,
};

const eyebrowStyle: CSSProperties = {
  display: "inline-block",
  fontSize: 12,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  opacity: 0.7,
  marginBottom: 8,
};

const titleStyle: CSSProperties = {
  fontSize: "clamp(2rem, 4vw, 3.25rem)",
  lineHeight: 1,
  marginBottom: 12,
};

const descriptionStyle: CSSProperties = {
  maxWidth: 720,
  fontSize: 16,
  lineHeight: 1.6,
  opacity: 0.82,
};

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main style={shellStyle}>
      <section style={heroStyle}>
        <div>
          {eyebrow ? <p style={eyebrowStyle}>{eyebrow}</p> : null}
          <h1 style={titleStyle}>{title}</h1>
          {description ? <p style={descriptionStyle}>{description}</p> : null}
        </div>
        {actions ? <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>{actions}</div> : null}
      </section>
      {children}
    </main>
  );
}