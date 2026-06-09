import { Card } from "@/components/ui/card";

export function DiscoveryErrorState({ message }: { message: string }) {
  return (
    <Card style={{ borderColor: "rgba(185, 28, 28, 0.2)" }}>
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>Discovery is temporarily unavailable.</h2>
      <p style={{ marginBottom: 12, lineHeight: 1.6, opacity: 0.84 }}>
        The route is wired to the real discovery service contract, but the current request could not load inventory units.
      </p>
      {process.env.NODE_ENV === "production" ? null : (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            padding: 16,
            borderRadius: 16,
            background: "rgba(185, 28, 28, 0.08)",
            overflowX: "auto",
          }}
        >
          {message}
        </pre>
      )}
    </Card>
  );
}