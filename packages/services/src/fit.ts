import type { InventoryUnitRow, OpportunityRow, RoleProfileRow } from "@bidspace/db";

// Explainable fit — never a black-box score. Three separated concerns:
//   eligibility  — can this vendor participate at all?
//   operational  — does the vendor's setup match the space?
//   attention    — things to resolve before applying.
// Each check carries human language; the UI renders the reasons, not a number.

export interface FitCheck {
  key: string;
  ok: boolean;
  label: string;
}

export type FitLevel = "strong" | "possible" | "review" | "blocked";

export interface FitReport {
  level: FitLevel;
  eligibility: FitCheck[];
  operational: FitCheck[];
  attention: string[];
}

export interface VendorFitInput {
  categoryTags: readonly string[];
  powerNeeds?: boolean | null;
  waterNeeds?: boolean | null;
  verifiedDocumentTypes?: readonly string[];
}

function normalize(tag: string): string {
  return tag.trim().toLowerCase();
}

function overlaps(a: readonly string[], b: readonly string[]): boolean {
  const set = new Set(a.map(normalize));
  return b.some((item) => set.has(normalize(item)));
}

export function assessFit(
  vendor: VendorFitInput,
  opportunity: Pick<OpportunityRow, "category_tags" | "bid_deadline" | "status">,
  unit?: Pick<
    InventoryUnitRow,
    "category_restrictions" | "power_available" | "water_available" | "required_documents"
  > | null,
  now: Date = new Date(),
): FitReport {
  const eligibility: FitCheck[] = [];
  const operational: FitCheck[] = [];
  const attention: string[] = [];

  // Eligibility — category restrictions on the unit gate participation.
  const restrictions = unit?.category_restrictions ?? [];
  if (restrictions.length > 0) {
    const allowed = vendor.categoryTags.length === 0 || overlaps(vendor.categoryTags, restrictions);
    eligibility.push({
      key: "category",
      ok: allowed,
      label: allowed
        ? "Your business category is accepted"
        : `Limited to: ${restrictions.join(", ")}`,
    });
    if (vendor.categoryTags.length === 0) {
      attention.push("Add business categories to your profile so hosts can confirm eligibility.");
    }
  } else if (opportunity.category_tags.length > 0 && vendor.categoryTags.length > 0) {
    const matched = overlaps(vendor.categoryTags, opportunity.category_tags);
    eligibility.push({
      key: "category",
      ok: true,
      label: matched
        ? "Your category matches what this host is looking for"
        : "Open to your category",
    });
  }

  // Eligibility — deadline.
  if (opportunity.bid_deadline) {
    const deadline = new Date(opportunity.bid_deadline);
    const open = deadline > now;
    eligibility.push({
      key: "deadline",
      ok: open,
      label: open ? "Submission window is open" : "Submission window has closed",
    });
  }

  // Operational — utilities.
  if (vendor.powerNeeds) {
    const ok = unit?.power_available !== false;
    operational.push({
      key: "power",
      ok,
      label: ok ? "Power is available at this position" : "This position has no power",
    });
  }
  if (vendor.waterNeeds) {
    const ok = unit?.water_available !== false;
    operational.push({
      key: "water",
      ok,
      label: ok ? "Water is available at this position" : "This position has no water",
    });
  }

  // Attention — required documents not yet on file.
  const required = unit?.required_documents ?? [];
  if (required.length > 0) {
    const have = new Set((vendor.verifiedDocumentTypes ?? []).map(normalize));
    const missing = required.filter((doc) => !have.has(normalize(doc)));
    if (missing.length > 0) {
      attention.push(`Documents required before selection: ${missing.join(", ")}.`);
    } else {
      operational.push({ key: "documents", ok: true, label: "Required documents on file" });
    }
  }

  const blockedByEligibility = eligibility.some((c) => !c.ok);
  const operationalGaps = operational.filter((c) => !c.ok).length;

  let level: FitLevel;
  if (blockedByEligibility) level = "blocked";
  else if (operationalGaps > 0) level = "review";
  else if (attention.length > 0) level = "possible";
  else level = "strong";

  return { level, eligibility, operational, attention };
}

export const FIT_LEVEL_LABEL: Record<FitLevel, string> = {
  strong: "Strong fit",
  possible: "Good fit — review notes",
  review: "Review before applying",
  blocked: "Not eligible",
};
