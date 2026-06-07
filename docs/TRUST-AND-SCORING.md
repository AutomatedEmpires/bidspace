# Trust, Verification & Scoring (Canonical) `LOCKED`

Mirrors the Notion "Trust, Verification & Data Moat" page. Scores are explainable signals, **not** promises.

## Scoring products (explainable, not black-box)
- **TrafficScore** — credibility of the audience / foot-traffic claim.
- **VisibilityScore** — how visible a unit is within a venue / zone.
- **AudienceScore** — category fit for a bidder.
- **InventoryScore** — overall unit value (traffic + visibility + audience + amenities + host quality + demand).
- **HostScore / BidderScore** — reliability from reviews, accuracy, disputes, no-shows, payment behavior.
- **BidFit** — strength of a specific bid for a specific unit (helps hosts pick the best, not just the highest — D008).

## Verification
Types: identity, business, host, bidder, venue, insurance, license, attendance, network. Lifecycle: not_started -> pending -> verified -> rejected / expired / revoked. Every badge requires evidence, review, status, and expiry where applicable. MVP focus: business identity, insurance, licenses, venue-control proof. (Per-type pass/fail criteria = open question O4, gated before badges ship.)

## Trust-language rule (binding copy guardrail)
| Use (signal language) | Never (promise language) |
|---|---|
| estimated, reported, projected | guaranteed, promised |
| historical signal, confidence band | verified traffic *(unless a verification record backs it)* |
| vendor feedback, category fit | revenue / ROI guarantee |
| "based on past events / reported attendance" | "you will earn / you will get X visitors" |

Rule of thumb: a number is only "verified" if a `verification_type` record backs it; otherwise it is "estimated" or "reported." When unsure, downgrade the claim. Applies to UI copy, marketing, and any rendered score.
