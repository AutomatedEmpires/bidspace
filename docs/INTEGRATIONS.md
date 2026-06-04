# Integration Providers (Canonical) `LOCKED`

The approved provider stack for BidSpace. Build against these; do not introduce alternatives without a new dated decision. Secrets for all of these live in **Doppler** — never commit real values. Variable names are documented in `.env.example`.

> Deliberately lean: **no Playwright / heavy e2e test tooling** for now. Keep the toolchain minimal.

## Runtime & platform
| Provider | Role | Notes |
|---|---|---|
| **Vercel** | Hosting / deploy | `apps/web` (Next.js) + serverless API routes; preview deploys per PR. |
| **Supabase** | Postgres + PostGIS, Storage, Realtime | System of record; Storage used for **private** verification documents (RLS). |
| **Clerk** | Authentication | Multi-role, org-aware accounts + team members. |
| **GoDaddy** | Domain / DNS | Registrar; DNS points apex + subdomains to Vercel. |

## Commerce & geo
| Provider | Role | Notes |
|---|---|---|
| **Stripe Connect** | Payments / payouts | No charge at bid; charge after host acceptance; platform fee + host payout. |
| **Mapbox** | Maps / spatial layer | Pins, clustering, zones, floorplans; pairs with PostGIS radius search. |
| **Cloudinary** | Media | **Public** marketplace media (unit photos, floorplans, galleries) + on-the-fly transforms/CDN. |

## Observability
| Provider | Role | Notes |
|---|---|---|
| **Sentry** | Error & performance monitoring | Web, mobile, API. |
| **PostHog** | Product analytics | Funnels, retention, session insight, feature flags. |

## Dev, secrets & source control
| Provider | Role | Notes |
|---|---|---|
| **GitHub** | Source control + CI + review | Canonical spec + code; Copilot review on PRs. |
| **Doppler** | Secrets management | Single source of env across local/staging/prod. Run via `doppler run -- <cmd>`. |
| **VS Code + Ubuntu** | Dev environment | Local source of truth; matches Explore&Earn workflow. |

## AI coding agents
| Provider | Role | Notes |
|---|---|---|
| **Claude Code Max** | Primary coding agent | Larger feature work / refactors. |
| **Codex** | Coding agent | Parallel/secondary execution. |
| **GitHub Copilot** | PR review + small tasks | Automated review before human/agent review. |

## Design & assets
| Provider | Role | Notes |
|---|---|---|
| **Figma** | UI/UX design | Source for the design system + screens. |
| **Canva Pro** | Marketing assets | Social, decks, launch creative. |
| **Streamline HQ Pro** | Icon system | Canonical icon set for UI. |

## Docs & ops
| Provider | Role | Notes |
|---|---|---|
| **Notion (Business)** | Vision log + ops/PM | Founder journal; **the repo is canonical for spec/code** (D017). |

## Media routing rule
- **Cloudinary** → public, transformable, CDN-served images/video (listings, galleries, floorplan renders).
- **Supabase Storage** → private/sensitive uploads (insurance, licenses, verification evidence) behind RLS.
