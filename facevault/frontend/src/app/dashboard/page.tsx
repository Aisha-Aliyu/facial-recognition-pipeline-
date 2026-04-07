"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useUser();

  const cards = [
    {
      href: "/dashboard/enroll",
      title: "Enroll a Face",
      desc: "Add a new face profile to your vault. Upload a clear photo and assign a label.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          <path d="M19 3v6M16 6h6" />
        </svg>
      ),
    },
    {
      href: "/dashboard/recognize",
      title: "Run Recognition",
      desc: "Upload a photo and match it against all enrolled faces in your vault instantly.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      href: "/dashboard/profiles",
      title: "Manage Profiles",
      desc: "View, search, and delete enrolled face profiles from your vault.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="7" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="7" r="3" />
          <path d="M13.5 14.2C14.3 14 15.1 14 16 14c3.3 0 6 2.7 6 6" />
        </svg>
      ),
    },
    {
      href: "/dashboard/logs",
      title: "Audit Logs",
      desc: "Full history of every recognition attempt with confidence scores and timestamps.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12h6M9 16h4M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2" />
          <rect x="7" y="2" width="10" height="4" rx="1" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "48px" }}>
        <p className="text-xs tracking-widest uppercase" style={{ color: "var(--gold)" }}>
          Dashboard
        </p>
        <h1
          className="font-display"
          style={{ fontSize: "2.8rem", color: "var(--text-primary)", marginTop: "8px" }}
        >
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}.
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "8px" }}>
          Your facial recognition vault is ready.
        </p>
      </div>

      {/* Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-px"
        style={{ background: "var(--gold-border)" }}
      >
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex flex-col group transition-all duration-200"
            style={{
              background: "var(--surface)",
              padding: "36px 32px",
              gap: "20px",
            }}
          >
            <div
              className="w-12 h-12 flex items-center justify-center border transition-all duration-200 group-hover:border-[#bfa27a]"
              style={{
                borderColor: "var(--gold-border)",
                color: "var(--gold)",
              }}
            >
              {card.icon}
            </div>
            <div>
              <h2
                className="font-display text-xl group-hover:text-[#bfa27a] transition-colors duration-200"
                style={{ color: "var(--text-primary)" }}
              >
                {card.title}
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.82rem",
                  lineHeight: 1.7,
                  marginTop: "8px",
                }}
              >
                {card.desc}
              </p>
            </div>
            <div
              className="text-xs tracking-widest uppercase group-hover:text-[#bfa27a] transition-colors duration-200"
              style={{ color: "var(--text-muted)", marginTop: "auto" }}
            >
              Open →
            </div>
          </Link>
        ))}
      </div>

      {/* Info strip */}
      <div
        className="flex flex-wrap gap-8 border-t"
        style={{ borderColor: "var(--gold-border)", marginTop: "48px", paddingTop: "32px" }}
      >
        {[
          { label: "Model", value: "FaceNet512" },
          { label: "Backend", value: "TensorFlow 2.17" },
          { label: "Detector", value: "RetinaFace" },
          { label: "Distance", value: "Cosine" },
          { label: "Threshold", value: "0.40" },
        ].map((item) => (
          <div key={item.label}>
            <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
              {item.label}
            </div>
            <div className="font-display text-lg" style={{ color: "var(--gold)", marginTop: "4px" }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
