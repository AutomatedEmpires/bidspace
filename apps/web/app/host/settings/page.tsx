import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildTrustSignals, listDocumentsForOrganization, listReviewsForOrganization } from "@bidspace/services";
import type { OrganizationRow } from "@bidspace/db";
import {
  Button,
  DescriptionList,
  EmptyState,
  Icon,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  StatusBadge,
} from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";
import { createConnectOnboardingLink, getConnectAccountStatus, isStripeEnabled } from "@/lib/stripe";

export const metadata: Metadata = { title: "Payouts & settings" };
export const dynamic = "force-dynamic";

export default async function HostSettingsPage() {
  const context = await requireHostContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const orgId = context.activeDbOrganizationId;
  const organization = (
    await db.from("organizations").select("*").eq("id", orgId).maybeSingle()
  ).data as OrganizationRow | null;
  if (!organization) {
    return <EmptyState icon="warning" title="Organization record not found" />;
  }

  const stripeEnabled = isStripeEnabled();
  const accountStatus =
    stripeEnabled && organization.stripe_account_id
      ? await getConnectAccountStatus(organization.stripe_account_id).catch(() => null)
      : null;

  const [documents, reviews] = await Promise.all([
    listDocumentsForOrganization(db, orgId),
    listReviewsForOrganization(db, orgId),
  ]);
  const completedBookings = (
    await db
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("host_organization_id", orgId)
      .in("status", ["completed", "reviewed"])
  ).count ?? 0;
  const trust = buildTrustSignals({
    organization,
    completedBookings,
    reviewCount: reviews.length,
    currentDocuments: documents,
  });

  async function connectPayoutsAction() {
    "use server";
    const current = await requireHostContext();
    const serverDb = tryGetDb();
    if (!serverDb || !isStripeEnabled()) return;
    const org = (
      await serverDb.from("organizations").select("*").eq("id", current.activeDbOrganizationId).maybeSingle()
    ).data as OrganizationRow | null;
    if (!org) return;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { accountId, url } = await createConnectOnboardingLink({
      existingAccountId: org.stripe_account_id,
      organizationName: org.name,
      email: org.email ?? undefined,
      returnUrl: `${siteUrl}/host/settings`,
      refreshUrl: `${siteUrl}/host/settings`,
    });
    if (!org.stripe_account_id) {
      await serverDb.from("organizations").update({ stripe_account_id: accountId }).eq("id", org.id);
    }
    redirect(url);
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Settings"
        title={organization.name}
        lede="Payout readiness and trust standing for your organization."
        actions={<StatusBadge status={organization.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Payouts" kicker="Stripe Connect" />
          <PanelBody className="grid gap-4">
            {!stripeEnabled ? (
              <p className="rounded-[3px] border border-line bg-canvas p-3 text-sm text-ink-muted dark:bg-ink dark:text-canvas-muted">
                Payments are not enabled in this environment — STRIPE_SECRET_KEY is not configured.
                Once keys are set via Doppler, hosts connect payouts from this page.
              </p>
            ) : organization.stripe_account_id ? (
              <>
                <DescriptionList
                  columns={1}
                  items={[
                    { term: "Connected account", detail: organization.stripe_account_id },
                    {
                      term: "Charges",
                      detail: accountStatus ? (accountStatus.chargesEnabled ? "Enabled" : "Not yet enabled") : "Unknown",
                    },
                    {
                      term: "Payouts",
                      detail: accountStatus ? (accountStatus.payoutsEnabled ? "Enabled" : "Not yet enabled") : "Unknown",
                    },
                  ]}
                />
                {accountStatus && !accountStatus.detailsSubmitted ? (
                  <form action={connectPayoutsAction}>
                    <Button type="submit" variant="signal" size="md">
                      <Icon name="payout" size={17} />
                      Finish Stripe onboarding
                    </Button>
                  </form>
                ) : (
                  <p className="flex items-center gap-2 text-sm font-medium text-moss dark:text-moss-bright">
                    <Icon name="success" size={16} /> Your payout account is ready. Vendors can pay;
                    BidSpace routes your share automatically.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-ink-muted dark:text-canvas-muted">
                  Connect a payout account to receive booking payments. BidSpace uses Stripe
                  destination charges: the vendor pays, the platform fee is withheld, the remainder
                  lands in your account.
                </p>
                <form action={connectPayoutsAction}>
                  <Button type="submit" variant="signal" size="md">
                    <Icon name="payout" size={17} />
                    Connect payouts with Stripe
                  </Button>
                </form>
              </>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Trust provenance" kicker="What vendors see about you" />
          <PanelBody>
            <ul className="grid gap-3">
              {trust.map((signal) => (
                <li key={signal.key} className="flex items-start gap-2.5">
                  <Icon
                    name={signal.earned ? "verified" : "pending"}
                    size={17}
                    weight={signal.earned ? "fill" : "regular"}
                    className={
                      signal.earned
                        ? "mt-0.5 shrink-0 text-moss dark:text-moss-bright"
                        : "mt-0.5 shrink-0 text-ink-faint dark:text-canvas-faint"
                    }
                  />
                  <span>
                    <span className="block text-sm font-semibold">{signal.label}</span>
                    <span className="block text-xs text-ink-muted dark:text-canvas-muted">{signal.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Organization" kicker="Managed in Clerk" />
        <PanelBody>
          <DescriptionList
            items={[
              { term: "Name", detail: organization.name },
              { term: "Type", detail: organization.organization_type.replace(/_/g, " ") },
              { term: "Verification", detail: organization.verification_status.replace(/_/g, " ") },
              { term: "Members & invites", detail: "Use the organization switcher menu to manage your team." },
            ]}
          />
        </PanelBody>
      </Panel>
    </div>
  );
}
