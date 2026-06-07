"use client";

import { useActionState } from "react";
import { fromCents, type CommerceLayer } from "@bidspace/core";

export interface BidFormState {
  status: "idle" | "success" | "error";
  message: string | null;
}

interface BidSubmissionFormProps {
  action: (state: BidFormState, formData: FormData) => Promise<BidFormState>;
  canSubmit: boolean;
  disabledReason?: string | null;
  minimumBidCents: number | null;
  commerceLayers: readonly CommerceLayer[];
}

const INITIAL_STATE: BidFormState = { status: "idle", message: null };

export function BidSubmissionForm(props: BidSubmissionFormProps) {
  const [state, formAction, isPending] = useActionState(props.action, INITIAL_STATE);
  const minimumBidDollars =
    props.minimumBidCents != null ? fromCents(props.minimumBidCents).toFixed(2) : "0.01";

  return (
    <form action={formAction} style={{ display: "grid", gap: 12, marginTop: 12 }}>
      <label style={{ display: "grid", gap: 4 }}>
        <span>Bid amount (USD)</span>
        <input
          type="number"
          name="amountDollars"
          inputMode="decimal"
          min={minimumBidDollars}
          step="0.01"
          required
          disabled={!props.canSubmit || isPending}
          placeholder={minimumBidDollars}
        />
      </label>

      <label style={{ display: "grid", gap: 4 }}>
        <span>Commerce layer (optional)</span>
        <select name="commerceLayer" disabled={!props.canSubmit || isPending} defaultValue="">
          <option value="">Select one</option>
          {props.commerceLayers.map((layer) => (
            <option key={layer} value={layer}>
              {layer}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "grid", gap: 4 }}>
        <span>Intended use (optional)</span>
        <textarea name="intendedUse" rows={3} disabled={!props.canSubmit || isPending} />
      </label>

      <button type="submit" disabled={!props.canSubmit || isPending}>
        {isPending ? "Submitting..." : "Submit bid"}
      </button>

      {!props.canSubmit && props.disabledReason ? (
        <p role="status" style={{ color: "#b45309" }}>
          {props.disabledReason}
        </p>
      ) : null}

      {state.message ? (
        <p role="status" style={{ color: state.status === "error" ? "#b91c1c" : "#166534" }}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
