import Link from "next/link";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import type { OrganizationRow, RoleProfileRow } from "@bidspace/db";
import {
  ServiceError,
  inviteToOpportunity,
  inviteVendorToNetwork,
  listNetworkForHost,
  listOpportunitiesForOrg,
} from "@bidspace/services";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Icon,
  Input,
  PageHeader,
  Panel,
  PanelBody,
  Select,
  buttonClasses,
} from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";

export const metadata: Metadata = { title: "Discover vendors" };
export const dynamic = "force-dynamic";

export default async function HostVendorDiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireHostContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const category = typeof params.category === "string" ? params.category.trim().toLowerCase() : "";
  const orgId = context.activeDbOrganizationId;
  const [profileResult, opportunities, network] = await Promise.all([
    db
      .from("role_profiles")
      .select("*")
      .in("role_type", ["bidder", "sponsor", "service_provider"])
      .eq("status", "active")
      .limit(200),
    listOpportunitiesForOrg(db, orgId),
    listNetworkForHost(db, orgId),
  ]);
  const profiles = (profileResult.data ?? []) as RoleProfileRow[];
  const organizationIds = profiles.map((profile) => profile.organization_id);
  const organizations = organizationIds.length
    ? (((
        await db
          .from("organizations")
          .select("id, name, logo_url, verification_status, city, state")
          .in("id", organizationIds)
      ).data ?? []) as Pick<
        OrganizationRow,
        "id" | "name" | "logo_url" | "verification_status" | "city" | "state"
      >[])
    : [];
  const networkByVendor = new Map(network.map((member) => [member.vendor_organization_id, member.status]));
  const categories = [...new Set(profiles.flatMap((profile) => profile.category_tags))].sort();
  const vendors = profiles.filter((profile) => {
    const organization = organizations.find((item) => item.id === profile.organization_id);
    const haystack = `${profile.display_name} ${profile.bio ?? ""} ${profile.category_tags.join(" ")} ${organization?.city ?? ""} ${organization?.state ?? ""}`.toLowerCase();
    return (!query || haystack.includes(query)) && (!category || profile.category_tags.includes(category));
  });
  const invitables = opportunities.filter((opportunity) =>
    ["draft", "published", "receiving_bids"].includes(opportunity.status),
  );

  async function inviteNetworkAction(formData: FormData) {
    "use server";
    const current = await requireHostContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    try {
      await inviteVendorToNetwork(serverDb, {
        hostOrganizationId: current.activeDbOrganizationId,
        vendorOrganizationId: String(formData.get("vendorOrganizationId") ?? ""),
        note: "Invited from host vendor discovery",
      });
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    revalidatePath("/host/vendors");
  }

  async function inviteSpaceAction(formData: FormData) {
    "use server";
    const current = await requireHostContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const opportunityId = String(formData.get("opportunityId") ?? "");
    const owned = await listOpportunitiesForOrg(serverDb, current.activeDbOrganizationId);
    if (!owned.some((opportunity) => opportunity.id === opportunityId)) return;
    try {
      await inviteToOpportunity(serverDb, {
        opportunityId,
        vendorOrganizationId: String(formData.get("vendorOrganizationId") ?? ""),
        message: String(formData.get("message") ?? "").trim() || undefined,
      });
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    revalidatePath("/host/vendors");
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Vendor discovery"
        title="Find businesses that fit your space"
        lede="Compare what vendors sell, how they set up, where they travel, and which requirements they can meet. Invite the right fit into your network or a specific space."
        actions={
          <Link href="/host/network" className={buttonClasses("secondary", "sm")}>
            View vendor network
          </Link>
        }
      />

      <form method="get" className="grid gap-3 rounded-[4px] border border-line bg-surface p-4 dark:bg-surface-dark sm:grid-cols-[1fr_240px_auto]">
        <Field label="Search" htmlFor="vendor-query">
          <Input id="vendor-query" name="q" defaultValue={query} placeholder="Business, setup, city, product…" />
        </Field>
        <Field label="Category" htmlFor="vendor-category">
          <Select id="vendor-category" name="category" defaultValue={category}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Button type="submit" variant="primary" size="md" className="self-end">
          <Icon name="search" size={16} /> Find vendors
        </Button>
      </form>

      {vendors.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {vendors.map((profile) => {
            const organization = organizations.find((item) => item.id === profile.organization_id);
            const details = profile.profile_details ?? {};
            const networkStatus = networkByVendor.get(profile.organization_id);
            return (
              <Panel key={profile.id}>
                <PanelBody className="grid gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-xl font-semibold">{profile.display_name}</h2>
                        {organization?.verification_status === "verified" ? (
                          <Badge tone="positive"><Icon name="verified" size={11} weight="fill" /> Verified</Badge>
                        ) : null}
                        {networkStatus ? <Badge tone="neutral">Network: {networkStatus}</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-ink-muted dark:text-canvas-muted">
                        {[organization?.city, organization?.state].filter(Boolean).join(", ") || "Service area not set"}
                        {profile.service_radius_miles ? ` · travels ${profile.service_radius_miles} miles` : ""}
                      </p>
                    </div>
                    {profile.slug ? (
                      <Link href={`/vendors/${profile.slug}`} className={buttonClasses("ghost", "sm")}>Profile</Link>
                    ) : null}
                  </div>
                  {profile.bio ? <p className="text-sm leading-relaxed">{profile.bio}</p> : null}
                  <div className="flex flex-wrap gap-1.5">
                    {profile.category_tags.slice(0, 6).map((tag) => <Badge key={tag} tone="neutral">{tag}</Badge>)}
                  </div>
                  {(details.setupType || details.spaceNeeds || details.powerNeeds || details.waterNeeds) ? (
                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                      {details.setupType ? <div><dt className="text-xs text-ink-muted">Setup</dt><dd>{details.setupType}</dd></div> : null}
                      {details.spaceNeeds ? <div><dt className="text-xs text-ink-muted">Space needs</dt><dd>{details.spaceNeeds}</dd></div> : null}
                      {details.powerNeeds ? <div><dt className="text-xs text-ink-muted">Power</dt><dd>{details.powerNeeds}</dd></div> : null}
                      {details.waterNeeds ? <div><dt className="text-xs text-ink-muted">Water</dt><dd>{details.waterNeeds}</dd></div> : null}
                    </dl>
                  ) : null}

                  <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                    <form action={inviteNetworkAction}>
                      <input type="hidden" name="vendorOrganizationId" value={profile.organization_id} />
                      <Button type="submit" variant="secondary" size="sm" className="w-full" disabled={Boolean(networkStatus)}>
                        <Icon name="network" size={15} /> {networkStatus ? "Already in network" : "Invite to network"}
                      </Button>
                    </form>
                    {invitables.length > 0 ? (
                      <form action={inviteSpaceAction} className="grid gap-2">
                        <input type="hidden" name="vendorOrganizationId" value={profile.organization_id} />
                        <Select name="opportunityId" aria-label={`Space for ${profile.display_name}`} required defaultValue="">
                          <option value="" disabled>Choose a space</option>
                          {invitables.map((opportunity) => (
                            <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>
                          ))}
                        </Select>
                        <Input name="message" aria-label={`Invitation note for ${profile.display_name}`} placeholder="Why this is a fit" />
                        <Button type="submit" variant="signal" size="sm" className="w-full">
                          <Icon name="send" size={15} /> Invite to space
                        </Button>
                      </form>
                    ) : (
                      <p className="text-xs text-ink-muted dark:text-canvas-muted">Create a space before sending a direct invitation.</p>
                    )}
                  </div>
                </PanelBody>
              </Panel>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="search"
          title="No vendors match yet"
          body="Try a broader category or search. Vendor profiles become more useful as businesses add setup and requirement details."
        />
      )}
    </div>
  );
}
