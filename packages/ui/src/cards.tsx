import { formatMoneyCents } from "./money.js";
import {
  type BidderCardDto,
  type BookingCardDto,
  type EventCardDto,
  type HostCardDto,
  type InventoryUnitCardDto,
  type OpportunityCardDto,
  type SignalLanguage,
} from "./types.js";
import { Card } from "./primitives.js";

function signalLabel(signal: SignalLanguage): string {
  return signal;
}

function StackRow({ label, value }: { label: string; value: string | number }) {
  return (
    <p style={{ margin: "0 0 var(--bs-space-xs, 0.5rem)", color: "var(--bs-color-text-secondary, #475467)" }}>
      <strong style={{ color: "var(--bs-color-text-primary, #101828)" }}>{label}:</strong> {value}
    </p>
  );
}

export function OpportunityCard({ dto }: { dto: OpportunityCardDto }) {
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>{dto.title}</h3>
      <StackRow label="Host" value={dto.host} />
      <StackRow label="Dates" value={dto.dates} />
      <StackRow label="Pricing mode" value={dto.pricingMode} />
      <StackRow label="Min bid" value={formatMoneyCents(dto.minBidCents, dto.currency)} />
      <StackRow label="Location" value={dto.location} />
      <StackRow label="Units" value={dto.unitCount} />
    </Card>
  );
}

export function InventoryUnitCard({ dto }: { dto: InventoryUnitCardDto }) {
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>{dto.type}</h3>
      <StackRow label="Price" value={formatMoneyCents(dto.priceCents, dto.currency)} />
      <StackRow label="Visibility" value={dto.visibility} />
      <StackRow label="Traffic signal" value={signalLabel(dto.trafficSignal)} />
      <StackRow label="Venue/zone" value={dto.venueZone} />
      <StackRow label="Status" value={dto.status} />
    </Card>
  );
}

export function HostCard({ dto }: { dto: HostCardDto }) {
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>{dto.name}</h3>
      <StackRow label="HostScore" value={`${dto.hostScore} (${signalLabel(dto.hostScoreSignal)})`} />
      <StackRow label="Verifications" value={dto.verifications.join(", ") || "None"} />
      <StackRow label="Venues" value={dto.venues} />
      <StackRow label="Response signal" value={signalLabel(dto.responseSignal)} />
    </Card>
  );
}

export function BidderCard({ dto }: { dto: BidderCardDto }) {
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>{dto.name}</h3>
      <StackRow label="BidderScore" value={`${dto.bidderScore} (${signalLabel(dto.bidderScoreSignal)})`} />
      <StackRow label="Category fit" value={dto.categoryFit} />
      <StackRow label="Verifications" value={dto.verifications.join(", ") || "None"} />
    </Card>
  );
}

export function EventCard({ dto }: { dto: EventCardDto }) {
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>{dto.name}</h3>
      <StackRow label="Type" value={dto.type} />
      <StackRow label="Dates" value={dto.dates} />
      <StackRow label="Venue" value={dto.venue} />
      <StackRow label="Opportunities" value={dto.opportunityCount} />
    </Card>
  );
}

export function BookingCard({ dto }: { dto: BookingCardDto }) {
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>{dto.unit}</h3>
      <StackRow label="Dates" value={dto.dates} />
      <StackRow label="Amount" value={formatMoneyCents(dto.amountCents, dto.currency)} />
      <StackRow label="Status" value={dto.status} />
      <StackRow label="Counterparty" value={dto.counterparty} />
    </Card>
  );
}
