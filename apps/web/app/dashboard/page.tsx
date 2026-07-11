import { redirect } from "next/navigation";
import { getCurrentUserOrgContext } from "@/lib/auth-context";
import { isHostSide, isVendorSide } from "@/lib/org-context";
import { getAdminUser } from "@/lib/admin-gate";

// No generic dashboard. Every user lands in the cockpit that matches their job.
export default async function DashboardDispatcher() {
  const context = await getCurrentUserOrgContext();
  if (!context) {
    redirect("/sign-in");
  }
  if (!context.activeClerkOrganizationId || !context.activeDbOrganizationId) {
    redirect("/onboarding");
  }

  if (isHostSide(context)) {
    redirect("/host");
  }
  if (isVendorSide(context)) {
    redirect("/discover");
  }

  const admin = await getAdminUser();
  if (admin) {
    redirect("/admin");
  }

  redirect("/onboarding?error=roles_required");
}
