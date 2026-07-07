import type { Metadata } from "next";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import {
  ServiceError,
  addDocument,
  aggregateReviews,
  buildTrustSignals,
  listDocumentsForOrganization,
  listReviewsForOrganization,
} from "@bidspace/services";
import { DOCUMENT_TYPE, roleProfileUpdateSchema, type DocumentType } from "@bidspace/core";
import type { OrganizationRow, RoleProfileRow } from "@bidspace/db";
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
  PanelHeader,
  Select,
  StatusBadge,
  Textarea,
} from "@bidspace/ui";
import { requireVendorContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Business profile" };
export const dynamic = "force-dynamic";

export default async function BusinessProfilePage() {
  const context = await requireVendorContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const orgId = context.activeDbOrganizationId;
  const [orgResult, profileResult, documents, reviews] = await Promise.all([
    db.from("organizations").select("*").eq("id", orgId).maybeSingle(),
    db.from("role_profiles").select("*").eq("organization_id", orgId).eq("role_type", "bidder").maybeSingle(),
    listDocumentsForOrganization(db, orgId),
    listReviewsForOrganization(db, orgId),
  ]);
  const organization = orgResult.data as OrganizationRow | null;
  const profile = profileResult.data as RoleProfileRow | null;
  if (!organization) {
    return <EmptyState icon="warning" title="Organization record not found" body="Re-run onboarding to link your organization." />;
  }

  const bookingCount = (
    await db
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("bidder_organization_id", orgId)
      .in("status", ["completed", "reviewed"])
  ).count ?? 0;

  const trust = buildTrustSignals({
    organization,
    completedBookings: bookingCount,
    reviewCount: reviews.length,
    currentDocuments: documents,
  });
  const ratings = aggregateReviews(reviews);

  async function updateProfileAction(formData: FormData) {
    "use server";
    const current = await requireVendorContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;

    const tags = String(formData.get("categoryTags") ?? "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const gallery = String(formData.get("galleryUrls") ?? "")
      .split(/\s+/)
      .map((u) => u.trim())
      .filter(Boolean);
    const radiusRaw = String(formData.get("serviceRadiusMiles") ?? "").trim();

    const parsed = roleProfileUpdateSchema.safeParse({
      displayName: String(formData.get("displayName") ?? "").trim() || undefined,
      bio: String(formData.get("bio") ?? "").trim() || undefined,
      categoryTags: tags,
      galleryUrls: gallery,
      serviceRadiusMiles: radiusRaw ? Number(radiusRaw) : undefined,
    });
    if (!parsed.success) return;

    const patch: Record<string, unknown> = { status: "active" };
    if (parsed.data.displayName !== undefined) patch.display_name = parsed.data.displayName;
    if (parsed.data.bio !== undefined) patch.bio = parsed.data.bio;
    patch.category_tags = parsed.data.categoryTags ?? [];
    patch.gallery_urls = parsed.data.galleryUrls ?? [];
    if (parsed.data.serviceRadiusMiles !== undefined) patch.service_radius_miles = parsed.data.serviceRadiusMiles;

    if (profile) {
      await serverDb.from("role_profiles").update(patch).eq("id", profile.id);
    } else {
      await serverDb.from("role_profiles").insert({
        organization_id: current.activeDbOrganizationId,
        role_type: "bidder",
        display_name: (patch.display_name as string) ?? current.activeOrganizationName ?? "My business",
        ...patch,
      });
    }
    revalidatePath("/business");
  }

  async function addDocumentAction(formData: FormData) {
    "use server";
    const current = await requireVendorContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const fileUrl = String(formData.get("fileUrl") ?? "").trim();
    const documentType = String(formData.get("documentType") ?? "") as DocumentType;
    if (!fileUrl || !(DOCUMENT_TYPE as readonly string[]).includes(documentType)) return;
    try {
      await addDocument(serverDb, {
        ownerOrganizationId: current.activeDbOrganizationId,
        fileUrl,
        documentType,
        expirationDate: String(formData.get("expirationDate") ?? "").trim() || undefined,
        uploadedByUserId: current.dbUserId ?? undefined,
      });
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    revalidatePath("/business");
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Business"
        title={profile?.display_name ?? organization.name}
        lede="This is what hosts see when they review your bids. A complete profile wins ties."
        actions={
          ratings.count > 0 ? (
            <div className="text-right">
              <p className="font-display text-2xl font-semibold tabular-nums">
                {ratings.averageRating} <span className="text-base font-normal">/ 5</span>
              </p>
              <p className="text-xs text-ink-muted dark:text-canvas-muted">
                {ratings.count} review{ratings.count === 1 ? "" : "s"}
                {ratings.wouldBookAgainRate != null ? ` · ${ratings.wouldBookAgainRate}% would rebook` : ""}
              </p>
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-6">
          <Panel>
            <PanelHeader title="Profile" kicker="Shown to hosts" />
            <PanelBody>
              <form action={updateProfileAction} className="grid gap-4">
                <Field label="Business name" htmlFor="displayName" required>
                  <Input
                    id="displayName"
                    name="displayName"
                    defaultValue={profile?.display_name ?? organization.name}
                    required
                  />
                </Field>
                <Field
                  label="What you do"
                  htmlFor="bio"
                  hint="Products, setup, what your booth looks like on a good day."
                >
                  <Textarea id="bio" name="bio" rows={4} defaultValue={profile?.bio ?? ""} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Categories"
                    htmlFor="categoryTags"
                    hint="Comma-separated: food, beverage, retail…"
                  >
                    <Input
                      id="categoryTags"
                      name="categoryTags"
                      defaultValue={(profile?.category_tags ?? []).join(", ")}
                      placeholder="food, beverage"
                    />
                  </Field>
                  <Field label="Travel radius (miles)" htmlFor="serviceRadiusMiles">
                    <Input
                      id="serviceRadiusMiles"
                      name="serviceRadiusMiles"
                      type="number"
                      min={1}
                      defaultValue={profile?.service_radius_miles ?? ""}
                      placeholder="150"
                    />
                  </Field>
                </div>
                <Field
                  label="Portfolio image URLs"
                  htmlFor="galleryUrls"
                  hint="One per line. Hosts should not have to search Instagram to understand your setup."
                >
                  <Textarea
                    id="galleryUrls"
                    name="galleryUrls"
                    rows={3}
                    defaultValue={(profile?.gallery_urls ?? []).join("\n")}
                    placeholder="https://res.cloudinary.com/…"
                  />
                </Field>
                <Button type="submit" variant="primary" size="md" className="justify-self-start">
                  Save profile
                </Button>
              </form>
            </PanelBody>
          </Panel>

          {profile?.gallery_urls?.length ? (
            <Panel>
              <PanelHeader title="Portfolio" kicker="How hosts see you" />
              <PanelBody>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {profile.gallery_urls.slice(0, 9).map((url) => (
                    <div key={url} className="relative aspect-square overflow-hidden rounded-[3px] border border-line">
                      <Image src={url} alt="" fill sizes="200px" className="object-cover" />
                    </div>
                  ))}
                </div>
              </PanelBody>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader title="Documents" kicker="Required by many hosts" />
            <PanelBody className="grid gap-4">
              {documents.length > 0 ? (
                <ul className="grid gap-2">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[3px] border border-line px-3 py-2 text-sm"
                    >
                      <span className="inline-flex items-center gap-2 font-medium">
                        <Icon name="document" size={15} />
                        {doc.document_type.replace(/_/g, " ")}
                      </span>
                      <span className="flex items-center gap-3">
                        {doc.expiration_date ? (
                          <span className="text-xs text-ink-muted dark:text-canvas-muted">
                            expires {formatDate(doc.expiration_date)}
                          </span>
                        ) : null}
                        <StatusBadge status={doc.status} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted dark:text-canvas-muted">
                  No documents on file. Insurance and permits are the most common requirements —
                  add them once, reuse them on every application.
                </p>
              )}
              <form action={addDocumentAction} className="grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_180px_150px_auto]">
                <Field label="Document URL" htmlFor="fileUrl">
                  <Input id="fileUrl" name="fileUrl" type="url" required placeholder="https://…" />
                </Field>
                <Field label="Type" htmlFor="documentType">
                  <Select id="documentType" name="documentType" defaultValue="insurance">
                    {DOCUMENT_TYPE.map((t) => (
                      <option key={t} value={t}>
                        {t.replace(/_/g, " ")}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Expires" htmlFor="expirationDate">
                  <Input id="expirationDate" name="expirationDate" type="date" />
                </Field>
                <Button type="submit" variant="secondary" size="md" className="self-end">
                  Add
                </Button>
              </form>
            </PanelBody>
          </Panel>
        </div>

        <aside className="grid content-start gap-4">
          <Panel>
            <PanelHeader title="Trust provenance" kicker="Why hosts can rely on you" />
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
                      <span className="block text-xs text-ink-muted dark:text-canvas-muted">
                        {signal.detail}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>
          {profile?.slug ? (
            <Panel>
              <PanelBody className="text-sm">
                <p className="kicker mb-1">Public profile</p>
                <p>
                  Hosts can view you at{" "}
                  <Badge tone="neutral" className="normal-case tracking-normal">
                    /vendors/{profile.slug}
                  </Badge>
                </p>
              </PanelBody>
            </Panel>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
