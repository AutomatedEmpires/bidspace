"use client";

import { useActionState } from "react";
import { fromCents, type CommerceLayer } from "@bidspace/core";
import { Button, Field, Icon, Input, Select, Textarea } from "@bidspace/ui";

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

const COMMERCE_LABEL: Record<string, string> = {
  physical_sales: "Selling on site",
  lead_generation: "Generating leads",
  brand_exposure: "Brand exposure",
  experience_activation: "Experience / activation",
  operational_service: "Operational service",
};

export function BidSubmissionForm(props: BidSubmissionFormProps) {
  const [state, formAction, isPending] = useActionState(props.action, INITIAL_STATE);
  const minimumBidDollars =
    props.minimumBidCents != null ? fromCents(props.minimumBidCents).toFixed(2) : "0.01";
  const disabled = !props.canSubmit || isPending;

  return (
    <form action={formAction} className="grid gap-4">
      <Field
        label="Your offer (USD)"
        htmlFor="bid-amount"
        required
        hint={`Minimum ${props.minimumBidCents != null ? `$${minimumBidDollars}` : "$0.01"} — offers are sealed; other bidders never see your amount.`}
      >
        <Input
          id="bid-amount"
          type="number"
          name="amountDollars"
          inputMode="decimal"
          min={minimumBidDollars}
          step="0.01"
          required
          disabled={disabled}
          placeholder={minimumBidDollars}
        />
      </Field>

      <Field label="What will you be doing here?" htmlFor="bid-layer">
        <Select id="bid-layer" name="commerceLayer" disabled={disabled} defaultValue="">
          <option value="">Select one (optional)</option>
          {props.commerceLayers.map((layer) => (
            <option key={layer} value={layer}>
              {COMMERCE_LABEL[layer] ?? layer}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Intended use"
        htmlFor="bid-use"
        hint="Tell the host what you sell, your setup, and why you fit this position."
      >
        <Textarea id="bid-use" name="intendedUse" rows={3} disabled={disabled} />
      </Field>

      <Button type="submit" variant="signal" size="lg" disabled={disabled}>
        <Icon name="bid" size={18} />
        {isPending ? "Submitting…" : "Submit sealed bid"}
      </Button>

      {!props.canSubmit && props.disabledReason ? (
        <p role="status" className="flex items-start gap-2 text-sm font-medium text-signal-deep dark:text-signal-bright">
          <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
          {props.disabledReason}
        </p>
      ) : null}

      {state.message ? (
        <p
          role="status"
          className={
            state.status === "error"
              ? "text-sm font-medium text-alert dark:text-alert-bright"
              : "text-sm font-medium text-moss dark:text-moss-bright"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

interface ApplicationSubmissionFormProps {
  action: (state: BidFormState, formData: FormData) => Promise<BidFormState>;
  canSubmit: boolean;
  disabledReason?: string | null;
}

export function ApplicationSubmissionForm(props: ApplicationSubmissionFormProps) {
  const [state, formAction, isPending] = useActionState(props.action, INITIAL_STATE);
  const disabled = !props.canSubmit || isPending;

  return (
    <form action={formAction} className="grid gap-4">
      <Field
        label="Your pitch to the host"
        htmlFor="application-pitch"
        required
        hint="Describe what you sell, who you serve, and why your business fits this space."
      >
        <Textarea id="application-pitch" name="pitch" rows={4} minLength={20} required disabled={disabled} />
      </Field>
      <Field label="Setup" htmlFor="application-setup" hint="Booth, trailer, table, signage, and load-in details.">
        <Textarea id="application-setup" name="setupDescription" rows={3} disabled={disabled} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor="application-category">
          <Input id="application-category" name="category" placeholder="Food, retail, services…" disabled={disabled} />
        </Field>
        <Field label="Space needs" htmlFor="application-space-needs">
          <Input id="application-space-needs" name="spaceNeeds" placeholder="10×10, trailer access…" disabled={disabled} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-5 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="powerNeeds" className="size-4 accent-signal" disabled={disabled} />
          I need power
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="waterNeeds" className="size-4 accent-signal" disabled={disabled} />
          I need water
        </label>
      </div>
      <Button type="submit" variant="signal" size="lg" disabled={disabled}>
        <Icon name="send" size={18} />
        {isPending ? "Submitting…" : "Submit application"}
      </Button>
      {!props.canSubmit && props.disabledReason ? (
        <p role="status" className="flex items-start gap-2 text-sm font-medium text-signal-deep dark:text-signal-bright">
          <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
          {props.disabledReason}
        </p>
      ) : null}
      {state.message ? (
        <p
          role="status"
          className={
            state.status === "error"
              ? "text-sm font-medium text-alert dark:text-alert-bright"
              : "text-sm font-medium text-moss dark:text-moss-bright"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
