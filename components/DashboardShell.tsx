"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { company } from "@/data/operational";
import { Brand } from "./Brand";

type DashboardShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  mode: "admin" | "customer";
  portalCustomerId?: string;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
};

function SidebarIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    dashboard: (
      <>
        <path d="M4 13h6V4H4v9Z" />
        <path d="M14 20h6v-9h-6v9Z" />
        <path d="M4 20h6v-3H4v3Z" />
        <path d="M14 7h6V4h-6v3Z" />
      </>
    ),
    overview: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 16V9" />
        <path d="M12 16V6" />
        <path d="M16 16v-4" />
      </>
    ),
    leads: (
      <>
        <path d="M15 19a6 6 0 0 0-12 0" />
        <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M19 8v6" />
        <path d="M16 11h6" />
      </>
    ),
    pelanggan: (
      <>
        <path d="M16 19a4 4 0 0 0-8 0" />
        <path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M5 18a3 3 0 0 1 3-3" />
        <path d="M16 15a3 3 0 0 1 3 3" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    kamera: (
      <>
        <path d="M4 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4V7Z" />
        <path d="m17 11 4-3v8l-4-3" />
        <path d="M8 11h3" />
      </>
    ),
    billing: (
      <>
        <path d="M4 6h16v12H4V6Z" />
        <path d="M4 10h16" />
        <path d="M8 15h4" />
      </>
    ),
    playback: (
      <>
        <path d="M5 5v14l12-7L5 5Z" />
        <path d="M19 6v12" />
      </>
    ),
    paket: (
      <>
        <path d="M4 8 12 4l8 4-8 4-8-4Z" />
        <path d="M4 8v8l8 4 8-4V8" />
        <path d="M12 12v8" />
      </>
    ),
    support: (
      <>
        <path d="M6 14v-2a6 6 0 0 1 12 0v2" />
        <path d="M6 14h3v5H6v-5Z" />
        <path d="M15 14h3v5h-3v-5Z" />
        <path d="M15 19h-3" />
      </>
    )
  };

  return (
    <span className="sidebarIcon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </svg>
    </span>
  );
}

export function DashboardShell({
  children,
  title,
  subtitle,
  mode,
  portalCustomerId,
  searchValue,
  searchPlaceholder,
  onSearchChange
}: DashboardShellProps) {
  const pathname = usePathname();
  const customerPortalPath = portalCustomerId
    ? `/customer-portal?customerId=${encodeURIComponent(portalCustomerId)}`
    : "/customer-portal";
  const nav =
    mode === "admin"
      ? [
          { icon: "overview", label: "Overview", href: "/admin" },
          { icon: "pelanggan", label: "Pelanggan", href: "/customer" },
          { icon: "kamera", label: "Kamera", href: "/camera" },
          { icon: "billing", label: "Billing", href: "/billing" },
          { icon: "users", label: "User", href: "/users" }
        ]
      : [
          { icon: "overview", label: "Overview", href: customerPortalPath },
          { icon: "kamera", label: "Live View", href: `${customerPortalPath}#live-view` },
          { icon: "playback", label: "Playback", href: `${customerPortalPath}#playback` },
          { icon: "paket", label: "Paket Saya", href: `${customerPortalPath}#paket-tagihan` },
          { icon: "support", label: "Support", href: `https://wa.me/${company.phoneWa}` }
        ];

  function isActiveRoute(href: string, label: string) {
    const baseHref = href.split("#")[0].split("?")[0];

    if (mode === "admin" && pathname === "/admin") {
      return label === "Overview";
    }

    return pathname === baseHref || (baseHref !== "/" && pathname.startsWith(`${baseHref}/`));
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebarBrand">
          <Brand />
          <span>{mode === "admin" ? "Sales Operation" : "Customer Portal"}</span>
        </div>
        <div className="sidebarNavGroup">
          <Link className="sidebarPrimary" href={mode === "admin" ? "/admin" : customerPortalPath}>
            <SidebarIcon name="dashboard" />
            Dashboard
          </Link>
          <p className="sidebarLabel">Aplikasi</p>
          <nav>
            {nav.map((item) => (
              <Link className={isActiveRoute(item.href, item.label) ? "is-active" : ""} href={item.href} key={item.label}>
                <SidebarIcon name={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <Link className="button buttonGhost" href="/">
          Landing Page
        </Link>
      </aside>
      <main className="dashboardMain">
        <header className="dashboardTopbar">
          <div className="dashboardSearch">
            <span>SR</span>
            <input
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={searchPlaceholder || (mode === "admin" ? "Cari lead, kamera, pelanggan..." : "Cari kamera, playback, support...")}
              readOnly={!onSearchChange}
            />
          </div>
          <div className="dashboardTopActions">
            <Link className="button buttonGhost" href="/">
              Landing
            </Link>
            <form action="/api/auth/logout" method="post">
              <button className="button buttonPrimary" type="submit">Keluar</button>
            </form>
          </div>
        </header>
        <div className="dashboardHeader">
          <div>
            <p className="dashboardCrumb">Dashboard / {mode === "admin" ? "Admin" : "Customer Portal"}</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
