"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect } from "react";
import { syncUser } from "@/lib/api";

const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/enroll",
    label: "Enroll Face",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        <path d="M19 3v6M16 6h6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/recognize",
    label: "Recognize",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M9 9l-2-2M15 9l2-2M9 15l-2 2M15 15l2 2" />
      </svg>
    ),
  },
  {
    href: "/dashboard/profiles",
    label: "Profiles",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="7" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <circle cx="17" cy="7" r="3" />
        <path d="M13.5 14.2C14.3 14 15.1 14 16 14c3.3 0 6 2.7 6 6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/logs",
    label: "Audit Logs",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12h6M9 16h4M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2" />
        <rect x="7" y="2" width="10" height="4" rx="1" />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    syncUser({
      clerk_id: user.id,
      email: user.primaryEmailAddress?.emailAddress || "",
      full_name: user.fullName || undefined,
    }).catch(() => {});
  }, [isLoaded, user]);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--void)" }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col border-r"
        style={{
          width: "240px",
          minHeight: "100vh",
          borderColor: "var(--gold-border)",
          background: "var(--surface)",
          padding: "0",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 border-b"
          style={{ borderColor: "var(--gold-border)", padding: "24px 20px" }}
        >
          <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="14" fill="#1c1c1c" />
            <circle cx="32" cy="26" r="10" stroke="#bfa27a" strokeWidth="2.5" fill="none" />
            <path d="M10 54c0-12.15 9.85-22 22-22s22 9.85 22 22" stroke="#bfa27a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <rect x="8" y="8" width="12" height="3" rx="1.5" fill="#5a4e4e" />
            <rect x="8" y="8" width="3" height="12" rx="1.5" fill="#5a4e4e" />
            <rect x="44" y="8" width="12" height="3" rx="1.5" fill="#5a4e4e" />
            <rect x="53" y="8" width="3" height="12" rx="1.5" fill="#5a4e4e" />
          </svg>
          <span className="font-display text-lg tracking-wider" style={{ color: "var(--gold)" }}>
            FaceVault
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col" style={{ padding: "16px 12px", gap: "4px", flex: 1 }}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 text-xs tracking-widest uppercase transition-all duration-200"
                style={{
                  padding: "12px 12px",
                  color: active ? "var(--gold)" : "var(--text-muted)",
                  background: active ? "var(--gold-dim)" : "transparent",
                  borderLeft: active ? "2px solid var(--gold)" : "2px solid transparent",
                }}
              >
                <span style={{ color: active ? "var(--gold)" : "var(--text-muted)" }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div
          className="flex items-center gap-3 border-t"
          style={{ borderColor: "var(--gold-border)", padding: "20px" }}
        >
          <UserButton afterSignOutUrl="/" />
          <div>
            <div className="text-xs" style={{ color: "var(--text-primary)" }}>
              {user?.firstName || "User"}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)", marginTop: "2px" }}>
              {user?.primaryEmailAddress?.emailAddress?.slice(0, 22)}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b"
        style={{
          background: "var(--surface)",
          borderColor: "var(--gold-border)",
          padding: "16px 20px",
        }}
      >
        <span className="font-display text-lg" style={{ color: "var(--gold)" }}>FaceVault</span>
        <UserButton afterSignOutUrl="/" />
      </div>

      {/* Mobile bottom nav */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t"
        style={{
          background: "var(--surface)",
          borderColor: "var(--gold-border)",
          padding: "12px 0 20px",
        }}
      >
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1"
              style={{ color: active ? "var(--gold)" : "var(--text-muted)" }}
            >
              {item.icon}
              <span style={{ fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {item.label.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main
        className="flex-1"
        style={{ padding: "32px", paddingTop: "80px", paddingBottom: "100px" }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
