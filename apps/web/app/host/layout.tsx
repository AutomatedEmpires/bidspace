import type { ReactNode } from "react";
import { CockpitShell, type CockpitNavItem } from "@/components/cockpit-shell";
import { requireHostContext } from "@/lib/org-context";

const NAV: CockpitNavItem[] = [
  { href: "/host", label: "Command", icon: "command", exact: true, mobile: true },
  { href: "/host/opportunities", label: "Opportunities", icon: "opportunity", mobile: true },
  { href: "/host/bids", label: "Bid review", icon: "bid", mobile: true },
  { href: "/host/bookings", label: "Bookings", icon: "booking", mobile: true },
  { href: "/host/venues", label: "Locations", icon: "venue" },
  { href: "/host/events", label: "Events", icon: "event" },
  { href: "/host/calendar", label: "Calendar", icon: "calendar", mobile: true },
  { href: "/host/network", label: "Vendor network", icon: "network" },
  { href: "/messages", label: "Messages", icon: "message" },
  { href: "/host/settings", label: "Payouts & settings", icon: "payout" },
];

export default async function HostLayout({ children }: { children: ReactNode }) {
  await requireHostContext();
  return (
    <CockpitShell navItems={NAV} cockpitLabel="Host" accentClassName="text-plan dark:text-plan-bright">
      {children}
    </CockpitShell>
  );
}
