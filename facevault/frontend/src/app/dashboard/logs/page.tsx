"use client";

import { useEffect, useState } from "react";
import { useVault, type VaultLog } from "@/lib/vault";

const COLUMNS = "md:grid-cols-[1fr_110px_110px_180px]";

export default function LogsPage() {
  const vault = useVault();
  const [logs, setLogs] = useState<VaultLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (vault.mode === "loading") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await vault.listLogs(50);
        if (!cancelled) setLogs(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setLogs([]);
          setError(err instanceof Error ? err.message : "Couldn't load the audit log.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vault]);

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <p className="text-xs tracking-widest uppercase" style={{ color: "var(--gold)" }}>Audit</p>
        <h1
          className="font-display"
          style={{ fontSize: "clamp(1.8rem, 6vw, 2.4rem)", color: "var(--text-primary)", marginTop: "8px", lineHeight: 1.15 }}
        >
          Recognition Logs
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "8px", lineHeight: 1.7 }}>
          Every recognition attempt with its best match, confidence and time.
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

      {/* Column headings, shown from tablet width up */}
      <div
        className={`hidden md:grid border-b gap-4 px-4 py-3 ${COLUMNS}`}
        style={{ borderColor: "var(--gold-border)" }}
      >
        {["Identity", "Status", "Confidence", "Timestamp"].map((h) => (
          <span key={h} className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>{h}</span>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "48px 16px", textAlign: "center" }}>
          <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Loading logs...</span>
        </div>
      ) : logs.length === 0 ? (
        <div style={{ padding: "64px 16px", textAlign: "center" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>No recognition attempts yet.</span>
        </div>
      ) : (
        <ul>
          {logs.map((log, i) => (
            <li
              key={log.id}
              className={`grid grid-cols-2 items-center border-b gap-x-4 gap-y-2 p-4 ${COLUMNS}`}
              style={{
                borderColor: "var(--gold-border)",
                background: i % 2 === 0 ? "transparent" : "var(--surface)",
              }}
            >
              <span
                className="text-sm font-display truncate"
                style={{ color: log.matched ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                {log.label || "Unknown face"}
              </span>
              <span className="justify-self-end md:justify-self-start">
                <span
                  className="text-xs tracking-widest uppercase"
                  style={{
                    color: log.matched ? "var(--gold)" : "#b43c3c",
                    background: log.matched ? "var(--gold-dim)" : "rgba(180,60,60,0.1)",
                    padding: "4px 8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {log.matched ? "Match" : "No match"}
                </span>
              </span>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {log.confidence != null ? `${log.confidence.toFixed(1)}%` : "No score"}
              </span>
              <span className="text-xs justify-self-end md:justify-self-start" style={{ color: "var(--text-muted)" }}>
                {new Date(log.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
