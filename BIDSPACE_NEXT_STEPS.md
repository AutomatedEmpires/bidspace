# Bidspace Next Steps

## Foundation Progress (2026-06-04)

- Completed: root `pnpm test` now runs the real `@bidspace/core`, `@bidspace/services`, and `@bidspace/web` suites through Turbo.
- Completed: CI now installs with `pnpm install --frozen-lockfile` and uses the real root test command.
- Completed: local setup is documented in `README.md`, and `.env.example` now explains where runtime vars belong for web dev and database tooling.
- Improved: missing Clerk runtime env still fails fast, but `apps/web/lib/env.ts` now throws a clearer developer-facing setup error and accepts `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` as a local alias.
- Remaining blocker: the web app still needs real Clerk keys for the first request and real Supabase server vars for authenticated/product routes; this branch documents that requirement instead of weakening it.

## 1. Top 10 Exact Fixes
1. Replace the root `test` script with real workspace test execution.
2. Update `.github/workflows/ci.yml` to run the real package tests instead of the placeholder root script.
3. Add a concise local setup section that explains how to populate Clerk and Supabase env vars for `pnpm --filter @bidspace/web dev`.
4. Migrate `apps/web/middleware.ts` to the current Next proxy convention to remove the framework deprecation warning.
5. Decide and document whether `pnpm approve-builds` is required locally so `supabase` CLI links are reliable.
6. Generate Supabase DB types and replace or reduce the hand-authored interfaces in `packages/db/src/types.ts`.
7. Create `packages/ui` with baseline tokens, layout primitives, buttons, form fields, and feedback components.
8. Build the first real marketplace browse/map page on top of `packages/services/src/discovery.ts` and `packages/db/migrations/0008_search.sql`.
9. Build the first inventory/opportunity CRUD route handlers and pages using the existing zod and service packages.
10. Add a deployment and smoke-test workflow for preview and production environments.

## 2. Suggested GitHub Issues
- `ci: wire root test script to actual workspace tests`
- `docs: add reproducible local env bootstrap for Clerk and Supabase`
- `chore: migrate Next middleware to proxy convention`
- `chore(db): generate Supabase TS types and remove manual drift risk`
- `design: create packages/ui and first token set`
- `feature: ship discovery browse/map surface`
- `feature: ship opportunity and inventory unit CRUD UI`
- `feature: ship bid submission and host bid pipeline UI`
- `feature: add payment + booking confirmation flow`
- `ops: add preview and production deployment workflows`

## 3. Suggested First Branch

`chore/ci-and-local-dev-foundation`

Why: the safest first branch fixes the repo-level trust issues before adding more product code.

## 4. Suggested First Pull Request

Title:

`chore: fix test orchestration and local dev bootstrap`

Scope:

- replace root `test` with workspace execution
- update CI to run real tests
- document Clerk/Supabase local env requirements
- document or fix local Supabase CLI build-script approval
- optionally migrate middleware/proxy if small enough for the same PR

## 5. Suggested CI Workflow

Recommended baseline workflow:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.12.4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm --filter @bidspace/core test
      - run: pnpm --filter @bidspace/services test
      - run: pnpm --filter @bidspace/web test
      - run: pnpm build
```

Recommended follow-up workflows:

- preview deployment on pull requests
- production deployment on protected `main`
- scheduled dependency audit
- database verification / type generation check

## 6. Suggested Design Token Cleanup

Introduce a small token system before adding more pages:

- color tokens: background, foreground, surface, muted, border, accent, danger, success
- typography tokens: display, heading, body, meta
- spacing scale: 4, 8, 12, 16, 24, 32, 48
- radius tokens: sm, md, lg, pill
- shadow tokens: subtle, card, overlay
- breakpoint tokens: sm, md, lg, xl
- motion tokens: fast, standard, slow

Implementation sequence:

1. define tokens in `packages/ui`
2. emit CSS variables
3. create primitives for button, input, checkbox, card, page shell
4. replace inline page styles in `apps/web`

## 7. Suggested Data Model Cleanup

- generate database types from Supabase and treat those as the typed DB baseline
- audit `packages/db/src/types.ts` for fields missing from current row contracts
- define explicit API DTOs instead of leaking raw row shapes into UI routes
- add a canonical `OrganizationContext` type for dashboard and auth flows
- add a canonical `InventoryUnitSummary` and `BidSummary` DTO for browse/detail/workflow pages

## 8. Suggested Component Consolidation Plan

Phase 1:

- `AppShell`
- `PageHeader`
- `Button`
- `Input`
- `CheckboxField`
- `Card`
- `EmptyState`
- `ErrorState`
- `LoadingState`

Phase 2:

- `OrganizationContextBanner`
- `RoleProfileList`
- `InventoryUnitCard`
- `BidStatusBadge`
- `PaymentSummaryCard`
- `BookingTimeline`

Phase 3:

- discovery map/list layout
- admin moderation tables
- review and verification components

## 9. Suggested MVP Scope

Keep MVP tight and sequential:

1. auth and organization onboarding
2. venue/opportunity/inventory creation
3. browse/map discovery
4. inventory detail
5. bid submission
6. host bid review and selection
7. payment and booking confirmation
8. basic messaging and review

Do not expand into AI scoring, enterprise analytics, or multi-market complexity until the above loop works end to end.

## 10. Suggested Production-Readiness Checklist

- real package tests wired into CI
- preview deployments live on PRs
- production deployment gated on green CI
- generated DB types committed or validated in CI
- local, staging, and production env bootstrap documented
- route-level authorization enforced for all mutations
- design tokens and shared UI primitives established
- error/loading/empty states added for all major routes
- basic accessibility review completed
- observability wired for web runtime and critical service flows
