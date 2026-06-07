import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trust", label: "Trust center" },
  { href: "/reviews", label: "Reviews" },
  { href: "/admin", label: "Admin" },
] as const;

interface PlatformShellProps {
  active: (typeof navItems)[number]["href"];
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function PlatformShell({ active, eyebrow, title, description, children }: PlatformShellProps) {
  return (
    <main className="platform-shell">
      <header className="platform-header">
        <div>
          <Link className="brand-mark" href="/dashboard">
            BidSpace
          </Link>
          <p className="eyebrow">{eyebrow ?? "Spatial commerce operations"}</p>
          <h1>{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        <div className="account-controls">
          <OrganizationSwitcher afterSelectOrganizationUrl={active} afterCreateOrganizationUrl="/onboarding" />
          <UserButton />
        </div>
      </header>

      <nav className="platform-nav" aria-label="Authenticated platform navigation">
        {navItems.map((item) => (
          <Link key={item.href} className={item.href === active ? "active" : undefined} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </main>
  );
}

export function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

export function StatusPill({ tone, children }: { tone?: string; children: React.ReactNode }) {
  return <span className={`status-pill ${tone ?? "neutral"}`}>{children}</span>;
}
