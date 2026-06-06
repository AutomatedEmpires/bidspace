export type SignalLanguage = "estimated" | "reported" | "projected";

export interface OpportunityCardDto {
  title: string;
  host: string;
  dates: string;
  pricingMode: string;
  minBidCents: number;
  location: string;
  unitCount: number;
  currency?: string;
}

export interface InventoryUnitCardDto {
  type: string;
  priceCents: number;
  visibility: string;
  trafficSignal: SignalLanguage;
  venueZone: string;
  status: string;
  currency?: string;
}

export interface HostCardDto {
  name: string;
  hostScore: number;
  hostScoreSignal: SignalLanguage;
  verifications: string[];
  venues: number;
  responseSignal: SignalLanguage;
}

export interface BidderCardDto {
  name: string;
  bidderScore: number;
  bidderScoreSignal: SignalLanguage;
  categoryFit: string;
  verifications: string[];
}

export interface EventCardDto {
  name: string;
  type: string;
  dates: string;
  venue: string;
  opportunityCount: number;
}

export interface BookingCardDto {
  unit: string;
  dates: string;
  amountCents: number;
  status: string;
  counterparty: string;
  currency?: string;
}
