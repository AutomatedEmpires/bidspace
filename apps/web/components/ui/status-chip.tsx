import type { CSSProperties } from "react";
import type { InventoryUnitStatus } from "@bidspace/core";
import { formatInventoryUnitStatusLabel } from "@/lib/discovery";

function getStatusColors(status: InventoryUnitStatus): CSSProperties {
  switch (status) {
    case "available":
      return {
        background: "rgba(22, 163, 74, 0.14)",
        color: "rgb(21, 128, 61)",
      };
    case "receiving_bids":
    case "shortlisted":
      return {
        background: "rgba(14, 165, 233, 0.14)",
        color: "rgb(3, 105, 161)",
      };
    case "reserved":
    case "payment_pending":
      return {
        background: "rgba(245, 158, 11, 0.16)",
        color: "rgb(180, 83, 9)",
      };
    case "booked":
    case "completed":
      return {
        background: "rgba(79, 70, 229, 0.16)",
        color: "rgb(67, 56, 202)",
      };
    default:
      return {
        background: "rgba(127, 127, 127, 0.18)",
        color: "var(--foreground)",
      };
  }
}

export function StatusChip({ status }: { status: InventoryUnitStatus }) {
  return (
    <span
      style={{
        ...getStatusColors(status),
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {formatInventoryUnitStatusLabel(status)}
    </span>
  );
}