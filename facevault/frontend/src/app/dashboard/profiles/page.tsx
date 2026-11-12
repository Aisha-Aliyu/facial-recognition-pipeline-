"use client";

import { useEffect, useState } from "react";
import { useVault, type VaultProfile } from "@/lib/vault";
import Image from "next/image";

// The grids below draw their thin lines with a background color showing through 1px
// gaps, so an unfilled last row showed that color as a solid block. GridFiller covers
// the empty cells with the page color. Its spans match grid-cols-2, md:grid-cols-3 and
// lg:grid-cols-4, and the class names are written out in full so Tailwind generates them.
const FILL_BASE = ["hidden", "block col-span-1"];
const FILL_MD = ["md:hidden", "md:block md:col-span-1", "md:block md:col-span-2"];
const FILL_LG = ["lg:hidden", "lg:block lg:col-span-1", "lg:block lg:col-span-2", "lg:block lg:col-span-3"];

function GridFiller({ count }: { count: number }) {
  const empty = (columns: number) => (columns - (count % columns)) % columns;
  return (
    <div
      aria-hidden="true"
      className={`${FILL_BASE[empty(2)]} ${FILL_MD[empty(3)]} ${FILL_LG[empty(4)]}`}
      style={{ background: "var(--void)" }}
    />
  );
}

export default function ProfilesPage() {
  const vault = useVault();
  const [profiles, setProfiles] = useState<VaultProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const data = await vault.listProfiles();
      setProfiles(data);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Load once sign-in status is known, from the account or this browser
  useEffect(() => {
    if (vault.mode === "loading") return;
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vault.mode]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await vault.removeProfile(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch {}
    finally { setDeleting(null); }
  };

  return (
    <div>
      <div style={{ marginBottom: "40px" }}>
        <p className="text-xs tracking-widest uppercase" style={{ color: "var(--gold)" }}>
          Profiles
        </p>
        <h1 className="font-display" style={{ fontSize: "2.4rem", color: "var(--text-primary)", marginTop: "8px" }}>
          Enrolled Faces
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "8px" }}>
          {profiles.length} profile{profiles.length !== 1 ? "s" : ""} in{" "}
          {vault.mode === "guest" ? "this browser" : "your vault"}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px" style={{ background: "var(--gold-border)" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ background: "var(--surface)", height: "220px", padding: "20px" }}>
              <div style={{ width: "100%", height: "140px", background: "var(--muted)", marginBottom: "12px" }} />
              <div style={{ height: "12px", background: "var(--muted)", width: "60%" }} />
            </div>
          ))}
          <GridFiller count={8} />
        </div>
      ) : profiles.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center border"
          style={{ borderColor: "var(--gold-border)", borderStyle: "dashed", padding: "80px 32px", textAlign: "center", gap: "16px" }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--text-muted)" }}>
            <circle cx="9" cy="7" r="3" />
            <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
            <circle cx="17" cy="7" r="3" />
            <path d="M13.5 14.2C14.3 14 15.1 14 16 14c3.3 0 6 2.7 6 6" />
          </svg>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            No faces enrolled yet. Go to Enroll to add your first profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px" style={{ background: "var(--gold-border)" }}>
          {profiles.map((profile) => (
            <div key={profile.id} className="flex flex-col group" style={{ background: "var(--surface)", padding: "16px", gap: "12px" }}>
              <div style={{ width: "100%", aspectRatio: "1", position: "relative", overflow: "hidden", border: "1px solid var(--gold-border)" }}>
                {profile.image_url ? (
                  <Image src={profile.image_url} alt={profile.label} fill style={{ objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--muted)" }} />
                )}
              </div>
              <div>
                <div className="font-display text-base" style={{ color: "var(--text-primary)" }}>{profile.label}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)", marginTop: "4px" }}>
                  {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => handleDelete(profile.id)}
                disabled={deleting === profile.id}
                className="text-xs tracking-widest uppercase transition-all duration-200"
                style={{
                  color: deleting === profile.id ? "var(--text-muted)" : "#b43c3c",
                  background: "transparent",
                  border: "1px solid",
                  borderColor: deleting === profile.id ? "var(--gold-border)" : "#5a2020",
                  padding: "8px",
                  cursor: deleting === profile.id ? "not-allowed" : "pointer",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                {deleting === profile.id ? "Removing..." : "Delete"}
              </button>
            </div>
          ))}
          <GridFiller count={profiles.length} />
        </div>
      )}
    </div>
  );
}
