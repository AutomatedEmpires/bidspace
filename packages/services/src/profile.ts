import type { DocumentRow, OrganizationRow, RoleProfileRow } from "@bidspace/db";

// A vendor's profile completeness — the product thesis is that a rich profile
// wins ties in host review ("a complete profile helps hosts understand your
// setup before you apply"). This turns that into an explicit, actionable meter.
// Pure + DB-free so it is unit-testable and reusable server-side.

export interface CompletenessItem {
  key: string;
  label: string;
  done: boolean;
  /** Deep-link hint for the UI ("Add a bio", etc.). */
  hint: string;
}

export interface Completeness {
  percent: number; // 0–100, rounded
  doneCount: number;
  total: number;
  items: CompletenessItem[];
  nextUp: CompletenessItem[]; // the first few incomplete items, for nudges
}

export interface VendorCompletenessInput {
  organization: Pick<OrganizationRow, "name" | "logo_url">;
  profile: Pick<
    RoleProfileRow,
    "display_name" | "bio" | "category_tags" | "gallery_urls" | "service_radius_miles"
  > | null;
  documents: readonly Pick<DocumentRow, "document_type" | "status" | "expiration_date">[];
  now?: Date;
}

function hasCurrentDocument(
  documents: VendorCompletenessInput["documents"],
  type: string,
  now: Date,
): boolean {
  return documents.some(
    (d) =>
      d.document_type === type &&
      (d.status === "verified" || d.status === "uploaded" || d.status === "pending") &&
      (!d.expiration_date || new Date(d.expiration_date) > now),
  );
}

export function vendorProfileCompleteness(input: VendorCompletenessInput): Completeness {
  const now = input.now ?? new Date();
  const p = input.profile;
  const nonEmpty = (v: string | null | undefined) => Boolean(v && v.trim().length > 0);

  const items: CompletenessItem[] = [
    {
      key: "name",
      label: "Business name",
      done: nonEmpty(p?.display_name) || nonEmpty(input.organization.name),
      hint: "Name your business so hosts recognize you.",
    },
    {
      key: "bio",
      label: "What you do",
      done: nonEmpty(p?.bio),
      hint: "Describe your products, setup, and what a good day looks like.",
    },
    {
      key: "categories",
      label: "Categories",
      done: (p?.category_tags?.length ?? 0) > 0,
      hint: "Add categories so hosts can confirm you fit their opportunity.",
    },
    {
      key: "portfolio",
      label: "Portfolio images",
      done: (p?.gallery_urls?.length ?? 0) > 0,
      hint: "Show your booth or products — hosts shouldn't have to search Instagram.",
    },
    {
      key: "radius",
      label: "Travel range",
      done: (p?.service_radius_miles ?? 0) > 0,
      hint: "Set how far you'll travel so we surface the right opportunities.",
    },
    {
      key: "logo",
      label: "Logo",
      done: nonEmpty(input.organization.logo_url),
      hint: "A logo makes your business instantly recognizable in bid review.",
    },
    {
      key: "insurance",
      label: "Insurance on file",
      done: hasCurrentDocument(input.documents, "insurance", now),
      hint: "Many hosts require current insurance before selection.",
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;
  return {
    percent: Math.round((doneCount / total) * 100),
    doneCount,
    total,
    items,
    nextUp: items.filter((i) => !i.done).slice(0, 3),
  };
}
