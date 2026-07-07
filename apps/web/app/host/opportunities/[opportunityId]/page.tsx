import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { INVENTORY_UNIT_TYPE, formatMoney, toCents } from "@bidspace/core";
import {
  NotFoundError,
  ServiceError,
  TransitionError,
  ValidationError,
  createInventoryUnit,
  getOpportunity,
  inviteToOpportunity,
  listBidsForOpportunity,
  listInventoryUnitsForOpportunity,
  listInvitationsForOpportunity,
  listNetworkForHost,
  publishOpportunity,
  transitionInventoryUnit,
  transitionOpportunity,
  updateInventoryUnit,
} from "@bidspace/services";
import type { OrganizationRow } from "@bidspace/db";
import {
  Badge,
  Button,
  CheckboxField,
  EmptyState,
  Field,
  Icon,
  Input,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  Select,
  StatusBadge,
  Textarea,
  buttonClasses,
} from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";
import { describeDeadline, formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Manage opportunity" };
export const dynamic = "force-dynamic";

export default async function ManageOpportunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ opportunityId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireHostContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const { opportunityId } = await params;
  const query = await searchParams;
  const errorMessage = typeof query.error === "string" ? decodeURIComponent(query.error) : null;

  let opportunity;
  try {
    opportunity = await getOpportunity(db, opportunityId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  if (opportunity.organization_id !== context.activeDbOrganizationId) notFound();

  const [units, invitations, network, bids] = await Promise.all([
    listInventoryUnitsForOpportunity(db, opportunityId),
    listInvitationsForOpportunity(db, opportunityId),
    listNetworkForHost(db, context.activeDbOrganizationId),
    listBidsForOpportunity(db, opportunityId, { organizationId: context.activeDbOrganizationId, isHost: true }),
  ]);

  const networkVendorIds = network.map((m) => m.vendor_organization_id);
  const vendorOrgs =
    networkVendorIds.length > 0
      ? (((await db.from("organizations").select("id, name").in("id", networkVendorIds)).data ??
          []) as Pick<OrganizationRow, "id" | "name">[])
      : [];

  const manageUrl = `/host/opportunities/${opportunityId}`;
  const publicUrl = `/opportunities/${opportunity.slug ?? opportunity.id}`;
  const activeBidCount = bids.filter((b) =>
    ["submitted", "viewed", "shortlisted", "countered", "waitlisted"].includes(b.status),
  ).length;

  async function lifecycleAction(formData: FormData) {
    "use server";
    const current = await requireHostContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const target = String(formData.get("target") ?? "");
    const existing = await getOpportunity(serverDb, opportunityId);
    if (existing.organization_id !== current.activeDbOrganizationId) return;
    try {
      if (target === "published") {
        await publishOpportunity(serverDb, opportunityId);
      } else if (["receiving_bids", "closed", "cancelled", "filled", "completed"].includes(target)) {
        await transitionOpportunity(serverDb, opportunityId, target as never);
        if (target === "receiving_bids") {
          // Units follow the release into bidding along their legal path.
          const currentUnits = await listInventoryUnitsForOpportunity(serverDb, opportunityId);
          for (const unit of currentUnits) {
            try {
              if (unit.status === "draft") await transitionInventoryUnit(serverDb, unit.id, "available");
              const fresh = unit.status === "draft" ? "available" : unit.status;
              if (fresh === "available") await transitionInventoryUnit(serverDb, unit.id, "receiving_bids");
            } catch (error) {
              if (!(error instanceof TransitionError)) throw error;
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        redirect(`${manageUrl}?error=${encodeURIComponent(error.message)}`);
      }
      throw error;
    }
    revalidatePath(manageUrl);
  }

  async function addUnitAction(formData: FormData) {
    "use server";
    const current = await requireHostContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const existing = await getOpportunity(serverDb, opportunityId);
    if (existing.organization_id !== current.activeDbOrganizationId) return;

    const value = (key: string) => String(formData.get(key) ?? "").trim();
    try {
      const startRaw = value("availabilityStart") || existing.starts_at;
      const endRaw = value("availabilityEnd") || existing.ends_at;
      if (!startRaw || !endRaw) {
        throw new ValidationError("Set an availability window (or give the opportunity operating dates first).");
      }
      const unit = await createInventoryUnit(serverDb, {
        opportunityId,
        organizationId: current.activeDbOrganizationId,
        type: (value("type") || "vendor_space") as (typeof INVENTORY_UNIT_TYPE)[number],
        name: value("name"),
        pricingMode: existing.pricing_mode,
        minimumBidCents: value("minimumBidDollars") ? toCents(Number(value("minimumBidDollars"))) : undefined,
        buyNowPriceCents: value("buyNowDollars") ? toCents(Number(value("buyNowDollars"))) : undefined,
        availabilityStart: new Date(startRaw).toISOString(),
        availabilityEnd: new Date(endRaw).toISOString(),
        latitude: value("latitude") ? Number(value("latitude")) : undefined,
        longitude: value("longitude") ? Number(value("longitude")) : undefined,
      });
      const restrictions = value("categoryRestrictions")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const requiredDocs = value("requiredDocuments")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      await updateInventoryUnit(serverDb, unit.id, {
        dimensions: value("dimensions") || undefined,
        powerAvailable: formData.get("powerAvailable") === "on",
        waterAvailable: formData.get("waterAvailable") === "on",
        vehicleAccess: formData.get("vehicleAccess") === "on",
        categoryRestrictions: restrictions.length ? restrictions : undefined,
        requiredDocuments: requiredDocs.length ? requiredDocs : undefined,
        notes: value("notes") || undefined,
      });
      // New units on a live release go straight into circulation.
      if (["published", "receiving_bids"].includes(existing.status)) {
        await transitionInventoryUnit(serverDb, unit.id, "available");
        if (existing.status === "receiving_bids") {
          await transitionInventoryUnit(serverDb, unit.id, "receiving_bids");
        }
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        redirect(`${manageUrl}?error=${encodeURIComponent(error.message)}`);
      }
      throw error;
    }
    revalidatePath(manageUrl);
  }

  async function inviteAction(formData: FormData) {
    "use server";
    const current = await requireHostContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const existing = await getOpportunity(serverDb, opportunityId);
    if (existing.organization_id !== current.activeDbOrganizationId) return;
    const vendorOrganizationId = String(formData.get("vendorOrganizationId") ?? "");
    if (!vendorOrganizationId) return;
    try {
      await inviteToOpportunity(serverDb, {
        opportunityId,
        vendorOrganizationId,
        message: String(formData.get("message") ?? "").trim() || undefined,
      });
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    revalidatePath(manageUrl);
  }

  const lifecycle: { target: string; label: string; variant: "signal" | "secondary" | "danger" }[] = [];
  if (opportunity.status === "draft") lifecycle.push({ target: "published", label: "Publish", variant: "signal" });
  if (opportunity.status === "published")
    lifecycle.push({ target: "receiving_bids", label: "Open bidding", variant: "signal" });
  if (opportunity.status === "receiving_bids")
    lifecycle.push({ target: "closed", label: "Close bidding", variant: "secondary" });
  if (opportunity.status === "closed")
    lifecycle.push(
      { target: "receiving_bids", label: "Reopen bidding", variant: "secondary" },
      { target: "completed", label: "Mark completed", variant: "secondary" },
    );
  if (["draft", "published", "receiving_bids"].includes(opportunity.status) && opportunity.status !== "draft")
    lifecycle.push({ target: "cancelled", label: "Cancel", variant: "danger" });

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Manage release"
        title={opportunity.title}
        lede={
          opportunity.bid_deadline
            ? `${describeDeadline(opportunity.bid_deadline) ?? ""} · deadline ${formatDateTime(opportunity.bid_deadline)}`
            : undefined
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={opportunity.status} />
            <Badge tone="neutral">
              {opportunity.visibility === "public"
                ? "Public"
                : opportunity.visibility === "network"
                  ? "Network"
                  : "Invite only"}
            </Badge>
            {opportunity.status !== "draft" ? (
              <Link href={publicUrl} className={buttonClasses("ghost", "sm")}>
                <Icon name="external" size={15} />
                View public page
              </Link>
            ) : null}
          </div>
        }
      />

      {errorMessage ? (
        <p role="alert" className="rounded-[3px] border border-alert/40 bg-alert/[0.06] px-4 py-3 text-sm font-medium text-alert">
          {errorMessage}
        </p>
      ) : null}

      {/* Lifecycle + bids strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[4px] border border-line bg-surface p-4 dark:bg-surface-dark">
        <div className="flex flex-wrap items-center gap-2">
          {lifecycle.map((step) => (
            <form key={step.target} action={lifecycleAction}>
              <input type="hidden" name="target" value={step.target} />
              <Button type="submit" variant={step.variant} size="sm">
                {step.label}
              </Button>
            </form>
          ))}
          {lifecycle.length === 0 ? (
            <p className="text-sm text-ink-muted dark:text-canvas-muted">
              This release is {opportunity.status.replace(/_/g, " ")}.
            </p>
          ) : null}
        </div>
        <Link
          href={`/host/bids?opportunity=${opportunityId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-signal-deep hover:underline dark:text-signal-bright"
        >
          <Icon name="bid" size={16} />
          {activeBidCount} bid{activeBidCount === 1 ? "" : "s"} awaiting review
        </Link>
      </div>

      {/* POSITIONS */}
      <Panel>
        <PanelHeader
          title={`Positions (${units.length})`}
          kicker="Inventory units"
          actions={
            opportunity.status === "draft" && units.length === 0 ? (
              <Badge tone="attention">Required before publish</Badge>
            ) : undefined
          }
        />
        <PanelBody className="grid gap-4">
          {units.length > 0 ? (
            <ul className="grid gap-2">
              {units.map((unit) => (
                <li
                  key={unit.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-line px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{unit.name}</p>
                    <p className="text-xs text-ink-muted dark:text-canvas-muted">
                      {[
                        unit.type.replace(/_/g, " "),
                        unit.dimensions,
                        unit.power_available ? "power" : null,
                        unit.water_available ? "water" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-sm">
                    <span className="font-semibold tabular-nums">
                      {unit.minimum_bid_cents != null ? `From ${formatMoney(unit.minimum_bid_cents)}` : "No floor"}
                    </span>
                    <StatusBadge status={unit.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted dark:text-canvas-muted">
              No positions yet. Bidders need a real space to pursue — add the first one below.
            </p>
          )}

          <details className="rounded-[3px] border border-dashed border-strong p-4" open={units.length === 0}>
            <summary className="cursor-pointer text-sm font-semibold">
              <Icon name="add" size={14} className="mr-1 inline" />
              Add a position
            </summary>
            <form action={addUnitAction} className="mt-4 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
                <Field label="Name" htmlFor="unit-name" required>
                  <Input id="unit-name" name="name" required placeholder="Booth A12 — main walkway" />
                </Field>
                <Field label="Type" htmlFor="unit-type">
                  <Select id="unit-type" name="type" defaultValue="vendor_space">
                    {INVENTORY_UNIT_TYPE.map((t) => (
                      <option key={t} value={t}>
                        {t.replace(/_/g, " ")}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <Field label="Floor (USD)" htmlFor="unit-min">
                  <Input id="unit-min" name="minimumBidDollars" type="number" min={0} step="0.01" />
                </Field>
                <Field label="Buy now (USD)" htmlFor="unit-buy">
                  <Input id="unit-buy" name="buyNowDollars" type="number" min={0} step="0.01" />
                </Field>
                <Field label="Dimensions" htmlFor="unit-dim">
                  <Input id="unit-dim" name="dimensions" placeholder="10×10 ft" />
                </Field>
                <div className="grid content-end gap-1.5 pb-1">
                  <CheckboxField name="powerAvailable" label="Power" />
                  <CheckboxField name="waterAvailable" label="Water" />
                  <CheckboxField name="vehicleAccess" label="Vehicle access" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Available from" htmlFor="unit-start" hint={opportunity.starts_at ? "Defaults to the opportunity window" : undefined}>
                  <Input id="unit-start" name="availabilityStart" type="datetime-local" />
                </Field>
                <Field label="Available until" htmlFor="unit-end">
                  <Input id="unit-end" name="availabilityEnd" type="datetime-local" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category restrictions" htmlFor="unit-cats" hint="Comma-separated; leave empty for open.">
                  <Input id="unit-cats" name="categoryRestrictions" placeholder="food" />
                </Field>
                <Field label="Required documents" htmlFor="unit-docs" hint="e.g. insurance, food_permit">
                  <Input id="unit-docs" name="requiredDocuments" placeholder="insurance" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Latitude (map pin)" htmlFor="unit-lat">
                  <Input id="unit-lat" name="latitude" type="number" step="any" min={-90} max={90} />
                </Field>
                <Field label="Longitude (map pin)" htmlFor="unit-lng">
                  <Input id="unit-lng" name="longitude" type="number" step="any" min={-180} max={180} />
                </Field>
              </div>
              <Field label="Operating notes" htmlFor="unit-notes">
                <Textarea id="unit-notes" name="notes" rows={2} />
              </Field>
              <Button type="submit" variant="primary" size="md" className="justify-self-start">
                Add position
              </Button>
            </form>
          </details>
        </PanelBody>
      </Panel>

      {/* INVITATIONS */}
      <Panel>
        <PanelHeader
          title="Invitations"
          kicker={
            opportunity.visibility === "invite_only"
              ? "This release is invitation-only"
              : "Direct offers to vendors you trust"
          }
        />
        <PanelBody className="grid gap-4">
          {invitations.length > 0 ? (
            <ul className="grid gap-2">
              {invitations.map((invitation) => {
                const vendor = vendorOrgs.find((v) => v.id === invitation.vendor_organization_id);
                return (
                  <li key={invitation.id} className="flex items-center justify-between gap-3 rounded-[3px] border border-line px-4 py-2.5 text-sm">
                    <span className="font-medium">{vendor?.name ?? invitation.vendor_organization_id}</span>
                    <StatusBadge status={invitation.status} />
                  </li>
                );
              })}
            </ul>
          ) : null}
          {vendorOrgs.length > 0 ? (
            <form action={inviteAction} className="grid gap-3 sm:grid-cols-[240px_1fr_auto]">
              <Field label="Vendor" htmlFor="invite-vendor">
                <Select id="invite-vendor" name="vendorOrganizationId" defaultValue="">
                  <option value="" disabled>
                    Choose from your network
                  </option>
                  {vendorOrgs.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Message" htmlFor="invite-message">
                <Input id="invite-message" name="message" placeholder="We would love to have you back this season." />
              </Field>
              <Button type="submit" variant="secondary" size="md" className="self-end">
                <Icon name="send" size={15} />
                Invite
              </Button>
            </form>
          ) : (
            <p className="text-sm text-ink-muted dark:text-canvas-muted">
              Your vendor network is empty.{" "}
              <Link href="/host/network" className="font-semibold underline">
                Add the vendors you already work with
              </Link>{" "}
              to send direct invitations.
            </p>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
