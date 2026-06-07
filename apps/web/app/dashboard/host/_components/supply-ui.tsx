import {
  COMMERCE_LAYER,
  EVENT_TYPE,
  INVENTORY_UNIT_TYPE,
  PRICING_MODE,
  VENUE_TYPE,
  inventoryUnitStatusTransitions,
  nextStates,
  opportunityStatusTransitions,
  type InventoryUnitStatus,
  type OpportunityStatus,
} from "@bidspace/core";
import type { EventRow, OpportunityRow, VenueRow } from "@bidspace/db";
import { getStatusTone, pretty } from "@/lib/host-supply";

export function StatusBadge({ status }: { status: string }) {
  return <span className="bs-status" data-tone={getStatusTone(status)}>{pretty(status)}</span>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="bs-empty"><strong>{title}</strong><p>{body}</p></div>;
}

export function OptionList({ values }: { values: readonly string[] }) {
  return <>{values.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</>;
}

export function VenueSelect({ venues, defaultValue, required = false }: { venues: VenueRow[]; defaultValue?: string | null; required?: boolean }) {
  return (
    <select name="venueId" defaultValue={defaultValue ?? ""} required={required}>
      <option value="">No venue</option>
      {venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
    </select>
  );
}

export function EventSelect({ events, defaultValue }: { events: EventRow[]; defaultValue?: string | null }) {
  return (
    <select name="eventId" defaultValue={defaultValue ?? ""}>
      <option value="">No event — venue/native inventory</option>
      {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
    </select>
  );
}

export function OpportunitySelect({ opportunities, defaultValue }: { opportunities: OpportunityRow[]; defaultValue?: string | null }) {
  return (
    <select name="opportunityId" defaultValue={defaultValue ?? ""} required>
      <option value="">Choose opportunity</option>
      {opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>)}
    </select>
  );
}

export function EnumSelect({ name, values, defaultValue, required = false }: { name: string; values: readonly string[]; defaultValue?: string | null; required?: boolean }) {
  return (
    <select name={name} defaultValue={defaultValue ?? ""} required={required}>
      {!required ? <option value="">Not set</option> : null}
      <OptionList values={values} />
    </select>
  );
}

export function VenueTypeSelect({ defaultValue }: { defaultValue?: string | null }) {
  return <EnumSelect name="venueType" values={VENUE_TYPE} defaultValue={defaultValue} required />;
}

export function EventTypeSelect({ defaultValue }: { defaultValue?: string | null }) {
  return <EnumSelect name="eventType" values={EVENT_TYPE} defaultValue={defaultValue} required />;
}

export function PricingModeSelect({ defaultValue }: { defaultValue?: string | null }) {
  return <EnumSelect name="pricingMode" values={PRICING_MODE} defaultValue={defaultValue ?? "hybrid"} required />;
}

export function CommerceLayerSelect({ defaultValue }: { defaultValue?: string | null }) {
  return <EnumSelect name="commerceLayer" values={COMMERCE_LAYER} defaultValue={defaultValue} />;
}

export function InventoryTypeSelect({ defaultValue }: { defaultValue?: string | null }) {
  return <EnumSelect name="type" values={INVENTORY_UNIT_TYPE} defaultValue={defaultValue} required />;
}

export function OpportunityStatusSelect({ status }: { status: OpportunityStatus }) {
  return (
    <select name="status" defaultValue="">
      <option value="">Move status…</option>
      {nextStates(opportunityStatusTransitions, status).map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
    </select>
  );
}

export function InventoryUnitStatusSelect({ status }: { status: InventoryUnitStatus }) {
  return (
    <select name="status" defaultValue="">
      <option value="">Move status…</option>
      {nextStates(inventoryUnitStatusTransitions, status).map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
    </select>
  );
}
