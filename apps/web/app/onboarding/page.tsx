import Link from "next/link";
import { redirect } from "next/navigation";
import { OrganizationList } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { MARKETPLACE_ROLE_TYPE } from "@bidspace/core";
import { BidSpaceWordmark, Button, Icon, Panel, PanelBody, type IconName } from "@bidspace/ui";

const DEFAULT_ORG_NAME = "BidSpace Organization";

const ROLE_PRESENTATION: Record<string, { icon: IconName; title: string; body: string }> = {
  host: {
    icon: "venue",
    title: "Host",
    body: "I control space, events, or access and want to release it as bookable inventory.",
  },
  bidder: {
    icon: "vendor",
    title: "Vendor / Bidder",
    body: "I run a business that books booths, pads, kiosks, and placements.",
  },
  venue_owner: {
    icon: "pin",
    title: "Venue owner",
    body: "I own or operate venues that hosts and events use.",
  },
  sponsor: {
    icon: "trend",
    title: "Sponsor",
    body: "I buy placements and activations for a brand.",
  },
  service_provider: {
    icon: "power",
    title: "Service provider",
    body: "I provide services (power, staging, cleaning…) to events and venues.",
  },
  network_operator: {
    icon: "network",
    title: "Network operator",
    body: "I coordinate a circuit of markets, events, or locations.",
  },
};

const ERROR_COPY: Record<string, string> = {
  roles_required: "Select at least one role so BidSpace can build the right workspace.",
  host_role_required: "This area is for hosts — add the Host role to your organization to continue.",
  vendor_role_required: "This area is for vendors — add the Vendor role to your organization to continue.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const authState = await auth();
  if (!authState.userId) {
    redirect("/sign-in?redirect_url=/onboarding");
  }
  const params = await searchParams;
  const errorKey = typeof params.error === "string" ? params.error : null;
  const errorMessage = errorKey ? (ERROR_COPY[errorKey] ?? null) : null;

  return (
    <main className="plan-grid min-h-dvh px-4 py-12 text-ink dark:text-canvas">
      <div className="mx-auto grid w-full max-w-2xl gap-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <BidSpaceWordmark />
          </Link>
        </div>

        {!authState.orgId ? (
          <Panel>
            <PanelBody className="grid gap-4">
              <div>
                <p className="kicker mb-1">Step 1 of 2</p>
                <h1 className="font-display text-2xl font-semibold">Create your organization</h1>
                <p className="mt-2 text-sm text-ink-muted dark:text-canvas-muted">
                  Everything on BidSpace belongs to an organization — your market, your food truck,
                  your venue company — so a team can run it together.
                </p>
              </div>
              <OrganizationList
                hidePersonal
                afterCreateOrganizationUrl="/onboarding"
                afterSelectOrganizationUrl="/onboarding"
              />
            </PanelBody>
          </Panel>
        ) : (
          <Panel>
            <PanelBody className="grid gap-5">
              <div>
                <p className="kicker mb-1">Step 2 of 2</p>
                <h1 className="font-display text-2xl font-semibold">How will you use BidSpace?</h1>
                <p className="mt-2 text-sm text-ink-muted dark:text-canvas-muted">
                  Pick every role that applies — many organizations both host and vend. This shapes
                  your workspace; it never limits what you can see.
                </p>
              </div>

              {errorMessage ? (
                <p role="alert" className="flex items-start gap-2 rounded-[3px] border border-alert/40 bg-alert/[0.06] px-3 py-2 text-sm font-medium text-alert">
                  <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
                  {errorMessage}
                </p>
              ) : null}

              <form action="/onboarding/complete" method="post" className="grid gap-5">
                <input type="hidden" name="organizationName" value={DEFAULT_ORG_NAME} />
                <fieldset className="grid gap-2.5">
                  <legend className="sr-only">Marketplace roles</legend>
                  {MARKETPLACE_ROLE_TYPE.map((role) => {
                    const presentation = ROLE_PRESENTATION[role];
                    if (!presentation) return null;
                    return (
                      <label
                        key={role}
                        className="flex cursor-pointer items-start gap-3 rounded-[4px] border border-line p-4 transition-colors hover:border-strong has-[:checked]:border-signal has-[:checked]:bg-signal/[0.04]"
                      >
                        <input
                          type="checkbox"
                          name="roles"
                          value={role}
                          className="mt-1 size-4 shrink-0 accent-signal"
                        />
                        <span className="flex items-start gap-3">
                          <Icon name={presentation.icon} size={22} className="mt-0.5 shrink-0 text-signal" />
                          <span>
                            <span className="block font-display font-semibold">{presentation.title}</span>
                            <span className="block text-sm text-ink-muted dark:text-canvas-muted">
                              {presentation.body}
                            </span>
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
                <Button type="submit" variant="signal" size="lg">
                  Enter your workspace
                  <Icon name="arrowRight" size={18} />
                </Button>
              </form>
            </PanelBody>
          </Panel>
        )}
      </div>
    </main>
  );
}
