# Screens & Card System (Canonical) `LOCKED`

Mirrors the Notion "Routes, Screens & Card System" card spec. Six canonical cards render the same object data per context. Each card maps to ONE component in `packages/ui` and reads a DTO (never a raw DB row).

| Card | Source object | Key fields | Primary contexts |
|---|---|---|---|
| Opportunity card | Opportunity | title, host, dates, pricing mode, min bid, location, unit count | discover feed, map sheet, saved |
| Inventory Unit card | Inventory Unit | type, price (cents), visibility, traffic signal, venue/zone, status | map sheet, opportunity detail, host inventory |
| Host card | Organization (host profile) | name, HostScore, verifications, venues, response signal | public host page, bid pipeline |
| Bidder card | Organization (bidder profile) | name, BidderScore, category fit, verifications | host bid pipeline, admin |
| Event card | Event | name, type, dates, venue, opportunity count | discover, venue page |
| Booking card | Booking | unit, dates, amount (cents), status, counterparty | bidder/host bookings, admin |

## Rules
- One component per card in `packages/ui`; contexts pass a variant, not a new component.
- Cards read DTOs (`InventoryUnitSummary`, `BidSummary`, etc.), never raw rows.
- Money fields are integer cents (D020); render via the shared money formatter.
- Trust/score fields follow the language rules in `docs/TRUST-AND-SCORING.md`.
