import type {
  DocumentStatus,
  OrganizationStatus,
  ReviewStatus,
  VerificationStatus,
} from "./enums";

export type TrustTone = "positive" | "attention" | "critical" | "neutral";

export interface StatusPresentation {
  label: string;
  tone: TrustTone;
  description: string;
}

export const VERIFICATION_STATUS_PRESENTATION: Record<VerificationStatus, StatusPresentation> = {
  not_started: {
    label: "Not started",
    tone: "neutral",
    description: "No verification evidence has been submitted yet.",
  },
  pending: {
    label: "Pending review",
    tone: "attention",
    description: "Evidence is waiting for marketplace or operator review.",
  },
  verified: {
    label: "Verified",
    tone: "positive",
    description: "This trust check is currently approved.",
  },
  rejected: {
    label: "Rejected",
    tone: "critical",
    description: "Submitted evidence did not meet the current trust requirement.",
  },
  expired: {
    label: "Expired",
    tone: "attention",
    description: "Verification existed but needs fresh evidence.",
  },
  revoked: {
    label: "Revoked",
    tone: "critical",
    description: "Verification was removed and should not be displayed as trusted.",
  },
};

export const DOCUMENT_STATUS_PRESENTATION: Record<DocumentStatus, StatusPresentation> = {
  uploaded: {
    label: "Uploaded",
    tone: "neutral",
    description: "The document is present but has not entered review.",
  },
  pending: {
    label: "Pending",
    tone: "attention",
    description: "The document is waiting for review.",
  },
  verified: {
    label: "Verified",
    tone: "positive",
    description: "The document has been accepted as supporting evidence.",
  },
  rejected: {
    label: "Rejected",
    tone: "critical",
    description: "The document cannot support marketplace trust in its current form.",
  },
  expired: {
    label: "Expired",
    tone: "attention",
    description: "The document is stale and should be replaced.",
  },
};

export const ORGANIZATION_STATUS_PRESENTATION: Record<OrganizationStatus, StatusPresentation> = {
  draft: {
    label: "Draft",
    tone: "neutral",
    description: "The organization is not yet marketplace-ready.",
  },
  pending_verification: {
    label: "Pending verification",
    tone: "attention",
    description: "The organization is waiting for trust review before full activation.",
  },
  active: {
    label: "Active",
    tone: "positive",
    description: "The organization can participate in marketplace workflows.",
  },
  restricted: {
    label: "Restricted",
    tone: "critical",
    description: "The organization has limited marketplace access.",
  },
  suspended: {
    label: "Suspended",
    tone: "critical",
    description: "Marketplace participation is paused until reviewed.",
  },
  archived: {
    label: "Archived",
    tone: "neutral",
    description: "The organization is no longer active in marketplace operations.",
  },
};

export const REVIEW_STATUS_PRESENTATION: Record<ReviewStatus, StatusPresentation> = {
  requested: {
    label: "Requested",
    tone: "attention",
    description: "A review has been requested but not submitted.",
  },
  submitted: {
    label: "Submitted",
    tone: "attention",
    description: "The review is captured and awaiting publication policy.",
  },
  flagged: {
    label: "Flagged",
    tone: "critical",
    description: "The review needs operator attention before display.",
  },
  published: {
    label: "Published",
    tone: "positive",
    description: "The review is eligible for reputation display.",
  },
  hidden: {
    label: "Hidden",
    tone: "neutral",
    description: "The review is retained internally but not displayed publicly.",
  },
};

export interface MarketplaceTrustInput {
  organizationStatus?: OrganizationStatus | null;
  organizationVerificationStatus?: VerificationStatus | null;
  verificationStatuses?: readonly VerificationStatus[];
  documentStatuses?: readonly DocumentStatus[];
  averageRating?: number | null;
  reviewCount?: number;
  openAdminActionCount?: number;
}

export interface MarketplaceTrustLevel {
  label: "Marketplace-ready" | "Needs review" | "Restricted" | "Unproven";
  tone: TrustTone;
  score: number;
  reasons: string[];
}

export function getMarketplaceTrustLevel(input: MarketplaceTrustInput): MarketplaceTrustLevel {
  let score = 35;
  const reasons: string[] = [];

  if (input.organizationStatus === "active") {
    score += 15;
    reasons.push("Organization is active.");
  } else if (input.organizationStatus === "restricted" || input.organizationStatus === "suspended") {
    score -= 25;
    reasons.push("Organization access is restricted or suspended.");
  } else {
    reasons.push("Organization is not fully active yet.");
  }

  if (input.organizationVerificationStatus === "verified") {
    score += 20;
    reasons.push("Organization verification is approved.");
  } else if (
    input.organizationVerificationStatus === "pending" ||
    input.organizationVerificationStatus === "expired"
  ) {
    score += 4;
    reasons.push("Organization verification needs operator follow-up.");
  } else if (
    input.organizationVerificationStatus === "rejected" ||
    input.organizationVerificationStatus === "revoked"
  ) {
    score -= 20;
    reasons.push("Organization verification is blocked.");
  } else {
    reasons.push("Organization verification has not started.");
  }

  const verificationStatuses = input.verificationStatuses ?? [];
  const verifiedChecks = verificationStatuses.filter((status) => status === "verified").length;
  const blockedChecks = verificationStatuses.filter(
    (status) => status === "rejected" || status === "revoked",
  ).length;
  score += Math.min(20, verifiedChecks * 5);
  score -= blockedChecks * 8;
  if (verifiedChecks) reasons.push(`${verifiedChecks} subject-level verification check(s) are approved.`);
  if (blockedChecks) reasons.push(`${blockedChecks} verification check(s) are blocked.`);

  const documentStatuses = input.documentStatuses ?? [];
  const verifiedDocs = documentStatuses.filter((status) => status === "verified").length;
  const staleDocs = documentStatuses.filter(
    (status) => status === "expired" || status === "rejected",
  ).length;
  score += Math.min(10, verifiedDocs * 2);
  score -= staleDocs * 5;
  if (verifiedDocs) reasons.push(`${verifiedDocs} supporting document(s) are verified.`);
  if (staleDocs) reasons.push(`${staleDocs} document(s) need replacement or review.`);

  if (input.reviewCount && input.reviewCount > 0 && input.averageRating != null) {
    score += Math.max(0, Math.min(15, (input.averageRating - 3) * 7.5));
    reasons.push(`${input.reviewCount} review(s) average ${input.averageRating.toFixed(1)} stars.`);
  } else {
    reasons.push("No reputation history has been captured yet.");
  }

  if (input.openAdminActionCount && input.openAdminActionCount > 0) {
    score -= Math.min(20, input.openAdminActionCount * 5);
    reasons.push(`${input.openAdminActionCount} operator action(s) are on record.`);
  }

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  if (input.organizationStatus === "restricted" || input.organizationStatus === "suspended") {
    return { label: "Restricted", tone: "critical", score: normalizedScore, reasons };
  }

  if (normalizedScore >= 75) {
    return { label: "Marketplace-ready", tone: "positive", score: normalizedScore, reasons };
  }

  if (normalizedScore >= 50) {
    return { label: "Needs review", tone: "attention", score: normalizedScore, reasons };
  }

  return { label: "Unproven", tone: "neutral", score: normalizedScore, reasons };
}

export function formatTrustSubjectType(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
