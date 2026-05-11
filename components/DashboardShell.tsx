import Link from "next/link";
import { Brand } from "./Brand";

type DashboardShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  mode: "admin" | "customer";
};

export function DashboardShell({ children, title, subtitle, mode }: DashboardShellProps) {
  const nav =
    mode === "admin"
      ? ["Overview", "Leads", "Pelanggan", "Kamera", "Billing"]
      : ["Overview", "Live View", "Playback", "Paket Saya", "Support"];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <Brand />
        <nav>
          {nav.map((item) => (
            <a href="#" key={item}>
              {item}
            </a>
          ))}
        </nav>
        <Link className="button buttonGhost" href="/">
          Landing Page
        </Link>
      </aside>
      <main className="dashboardMain">
        <div className="dashboardHeader">
          <div>
            <p className="eyebrow">{mode === "admin" ? "Admin demo" : "Customer demo"}</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <Link className="button buttonPrimary" href="/login">
            Switch Demo
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
