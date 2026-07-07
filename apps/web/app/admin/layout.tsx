import type { ReactNode } from "react";
import { CockpitShell, type CockpitNavItem } from "@/components/cockpit-shell";
import { requireAdminUser } from "@/lib/admin-gate";

const NAV: CockpitNavItem[] = [
  { href: "/admin", label: "Intervention queue", icon: "command", exact: true, mobile: true },
  { href: "/admin/verification", label: "Verification", icon: "verified", mobile: true },
  { href: "/admin/organizations", label: "Organizations", icon: "venue", mobile: true },
  { href: "/admin/reports", label: "Reports & disputes", icon: "alert", mobile: true },
  { href: "/admin/payments", label: "Payment exceptions", icon: "money", mobile: true },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminUser();
  return (
    <CockpitShell navItems={NAV} cockpitLabel="Admin" accentClassName="text-alert">
      {children}
    </CockpitShell>
  );
}
