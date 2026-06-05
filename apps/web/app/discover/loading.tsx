import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";

export default function DiscoverLoading() {
  return (
    <PageShell
      eyebrow="Market discovery"
      title="Loading inventory units"
      description="Preparing the first contract-backed discovery surface."
    >
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <div style={{ height: 18, width: "40%", borderRadius: 999, background: "rgba(127,127,127,0.18)", marginBottom: 16 }} />
            <div style={{ height: 28, width: "70%", borderRadius: 10, background: "rgba(127,127,127,0.14)", marginBottom: 12 }} />
            <div style={{ height: 14, width: "100%", borderRadius: 8, background: "rgba(127,127,127,0.1)", marginBottom: 8 }} />
            <div style={{ height: 14, width: "84%", borderRadius: 8, background: "rgba(127,127,127,0.1)" }} />
          </Card>
        ))}
      </div>
    </PageShell>
  );
}