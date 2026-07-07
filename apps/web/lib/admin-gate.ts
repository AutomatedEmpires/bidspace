import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Admin is never a public selectable role. A user is a platform admin only if
// their Clerk id is allow-listed via ADMIN_USER_IDS or their Clerk
// publicMetadata carries bidspaceAdmin: true (set from the Clerk dashboard).
export async function getAdminUser() {
  const user = await currentUser();
  if (!user) return null;

  const allowList = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (allowList.includes(user.id)) return user;

  const metadata = user.publicMetadata as Record<string, unknown> | null;
  if (metadata?.bidspaceAdmin === true) return user;

  return null;
}

export async function requireAdminUser() {
  const user = await getAdminUser();
  if (!user) {
    redirect("/dashboard");
  }
  return user;
}
