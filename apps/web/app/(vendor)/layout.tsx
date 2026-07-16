import type { ReactNode } from "react";
import { CockpitShell, type CockpitNavItem } from "@/components/cockpit-shell";
import { requireVendorContext } from "@/lib/org-context";

const NAV: CockpitNavItem[] = [
  { href: "/discover", label: "Discover", icon: "explore", mobile: true },
  { href: "/saved", label: "Saved", icon: "save", mobile: true },
  { href: "/bids", label: "Submissions", icon: "bid", mobile: true },
  { href: "/bookings", label: "Placement preview", icon: "booking", mobile: true },
  { href: "/business", label: "Business", icon: "vendor", mobile: true },
  { href: "/messages", label: "Messages", icon: "message" },
];

export default async function VendorLayout({ children }: { children: ReactNode }) {
  await requireVendorContext();
  return (
    <CockpitShell navItems={NAV} cockpitLabel="Vendor" accentClassName="text-signal">
      {children}
    </CockpitShell>
  );
}
