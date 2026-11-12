"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useVault, type VaultProfile } from "@/lib/vault";

export default function ProfilesPage() {
  const vault = useVault();
  const [profiles, setProfiles] = useState<VaultProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (vault.mode === "loading") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await vault.listProfiles();
        if (!cancelled) setProfiles(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setProfiles([]);
          setError(err instanceof Error ? err.message : "Couldn't load your profiles.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vault]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setError("");
    try {
      await vault.removeProfile(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't delete that profile.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <p className="text-xs tracking-widest uppercase" style={{ color: "var(--gold)" }}>
          Profiles
        </p>
        <h1
          className="font-display"
          style={{ fontSize: "clamp(1.8rem, 6vw, 2.4rem)", color: "var(--text-primary)", marginTop: "8px", lineHeight: 1.15 }}
        >
          Enrolled Faces
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "8px" }}>
          {profiles.length} profile{profiles.length !== 1 ? "s" : ""} in{" "}
          {vault.mode === "guest" ? "this browser" : "your vault"}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="text-xs"
          style={{ marginBottom: "16px", padding: "14px 16px", background: "rgba(90,30,30,0.15)", borderLeft: "2px solid #b43c3c", color: "#e07070", lineHeight: 1.6 }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px" style={{ background: "var(--gold-border)" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: "var(--surface)", padding: "16px" }}>
              <div style={{ width: "100%", aspectRatio: "1", background: "var(--muted)", marginBottom: "12px" }} />
              <div style={{ height: "12px", background: "var(--muted)", width: "60%" }} />
            </div>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center border px-6 py-14 md:py-20"
          style={{ borderColor: "var(--gold-border)", borderStyle: "dashed", textAlign: "center", gap: "16px" }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--text-muted)" }} aria-hidden="true">
            <circle cx="9" cy="7" r="3" />
            <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
            <circle cx="17" cy="7" r="3" />
            <path d="M13.5 14.2C14.3 14 15.1 14 16 14c3.3 0 6 2.7 6 6" />
          </svg>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>
            No faces enrolled yet.{" "}
            <Link href="/dashboard/enroll" style={{ color: "var(--gold)", textDecoration: "underline" }}>
              Enroll your first face
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px" style={{ background: "var(--gold-border)" }}>
          {profiles.map((profile) => (
            <div key={profile.id} className="flex flex-col p-3 md:p-4" style={{ background: "var(--surface)", gap: "12px" }}>
              <div style={{ width: "100%", aspectRatio: "1", position: "relative", overflow: "hidden", border: "1px solid var(--gold-border)" }}>
                {profile.image_url ? (
                  <Image
                    src={profile.image_url}
                    alt={profile.label}
                    fill
                    unoptimized={profile.image_url.startsWith("data:")}
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--muted)" }} />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="font-display text-base truncate" style={{ color: "var(--text-primary)" }}>{profile.label}</div>
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
                  padding: "10px 8px",
                  cursor: deleting === profile.id ? "not-allowed" : "pointer",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                {deleting === profile.id ? "Removing..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
