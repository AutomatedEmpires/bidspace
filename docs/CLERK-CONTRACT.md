# Clerk — Production Activation Contract

Everything the code requires of Clerk, verified against
`apps/web/proxy.ts`, `app/layout.tsx`, `lib/auth-context.ts`,
`lib/permissions.ts`, `app/onboarding/**`, and the sign-in/up routes. There is
**no Clerk API/MCP available to the agent** — the dashboard requires interactive
login, so this is the exact founder hand-off.

## The founder action, reduced to its minimum

> Create one Clerk application named **BidSpace**, **enable Organizations**
> (allow users to create them), and provide the resulting keys.

Everything below is detail behind that sentence.

## Hard requirements

| Requirement | Why | Evidence |
|---|---|---|
| **Organizations enabled** | The product is org-first: every actor works through an organization. | `auth().orgId` / `auth().orgRole`, `clerk.organizations.getOrganization`, `<OrganizationList>` / `<OrganizationSwitcher>` |
| Users may **create** organizations | Host/vendor onboarding creates a Clerk org, then a BidSpace org row. | `app/onboarding/page.tsx` (`<OrganizationList>`), `onboarding/complete/route.ts` |
| Secret key can **update org publicMetadata** | The BidSpace org id is written back to the Clerk org as `publicMetadata.bidspaceOrganizationId` and read on every request. | `onboarding/complete/route.ts`, `auth-context.ts:getBidspaceOrganizationId` |
| `CLERK_ENCRYPTION_KEY` set | `proxy.ts` passes `secretKey` explicitly to `clerkMiddleware`; Clerk then requires an encryption key or **every request 500s**. | `proxy.ts` |

## Keys to hand over (→ Doppler `bidspace/prd`, then Vercel)

- `CLERK_PUBLISHABLE_KEY` (also accepted as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
- `CLERK_SECRET_KEY`
- `CLERK_ENCRYPTION_KEY` — generate: `openssl rand -hex 32`

## Roles — default is sufficient

`lib/permissions.ts` maps Clerk org roles by stripping the `org:` prefix and
ranking `viewer < member < manager < admin < owner`. **Clerk's default
`org:admin` + `org:member` are enough**: the org creator is `org:admin` → passes
every `hasOrgRole` gate; members pass viewer/member gates. Custom roles
(manager/viewer/owner) are optional refinements, not launch requirements.

## Paths / redirects

`ClerkProvider` is configured with only `publishableKey`; redirect behavior
comes from **Clerk dashboard Paths** (or the optional
`NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `..._SIGN_UP_URL` /
`..._SIGN_IN_FALLBACK_REDIRECT_URL` env vars). Set in the dashboard:

| Setting | Value |
|---|---|
| Sign-in URL | `/sign-in` |
| Sign-up URL | `/sign-up` |
| After sign-in | `/dashboard` (role dispatcher → host/vendor/admin cockpit) |
| After sign-up | `/onboarding` (org creation → role selection) |

The sign-in/up routes are catch-all (`/sign-in/[[...sign-in]]`,
`/sign-up/[[...sign-up]]`) so Clerk's flows mount cleanly. Org switching already
sets `afterSelectOrganizationUrl="/dashboard"` /
`afterCreateOrganizationUrl="/onboarding"` in code.

## Webhooks — NOT required

The app consumes **no Clerk webhooks** (only `/api/discovery` and
`/api/stripe/webhook` exist). User + organization records are synced
**synchronously** during `/onboarding/complete`. Do not create a Clerk webhook
endpoint for launch. *(Optional future hardening: a `user.updated` /
`organization.updated` webhook to keep the `users`/`organizations` mirror fresh
on profile edits — not needed to go live.)*

## Origins / instance choice (matters for the temporary Vercel host)

- A Clerk **development** instance works on any origin (including
  `*.vercel.app`) and is the right choice for the initial deployment + E2E proof
  while no custom domain exists.
- A Clerk **production** instance requires a **custom domain** with DNS
  (`clerk.<domain>` CNAME). Since no domain is being purchased yet, defer the
  production instance until a domain exists; run the proof on the dev instance
  keyed to the assigned `*.vercel.app` host. Add that host to the instance's
  allowed origins.

## Admin

Platform admin (`/admin`) is gated in `lib/admin-gate.ts` by **either**
`ADMIN_USER_IDS` (comma-separated Clerk user ids) **or** Clerk
`publicMetadata.bidspaceAdmin === true` on the user. After creating your own
Clerk user, set one of these.

## Code currency — verified

Uses current Clerk v7 surface: `clerkMiddleware` (not the deprecated
`authMiddleware`), `auth()`, `currentUser()`, `clerkClient()`,
`<ClerkProvider>`, `<UserButton>`, `<OrganizationSwitcher>`. No obsolete Clerk
assumptions remain.
