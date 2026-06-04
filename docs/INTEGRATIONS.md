# Integration Providers (Canonical) `LOCKED`

The approved **third-party service providers** for BidSpace. Build against these; do not introduce alternative *providers* without a new dated decision. Secrets for all of these live in **Doppler** — never commit real values. Variable names are documented in `.env.example`.

> Scope note: this registry lists **service providers only**. Standard dev tooling — **npm/pnpm**, **Playwright** (e2e), **TypeScript**, ESLint/Prettier, Turborepo — is assumed and in active use; it is intentionally not enumerated here.

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

## Standard tooling (assumed, not a provider)
npm / pnpm · Playwright (e2e) · TypeScript · ESLint + Prettier · Turborepo · Supabase CLI · Stripe CLI. In use across the monorepo; listed here only to record that they are part of the workflow.

## Media routing rule
- **Cloudinary** → public, transformable, CDN-served images/video (listings, galleries, floorplan renders).
- **Supabase Storage** → private/sensitive uploads (insurance, licenses, verification evidence) behind RLS.
