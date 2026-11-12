"use client";

import { useEffect, useState } from "react";
import { useVault, type VaultLog } from "@/lib/vault";

export default function LogsPage() {
  const vault = useVault();
  const [logs, setLogs] = useState<VaultLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Load once sign-in status is known, from the account or this browser
  useEffect(() => {
    if (vault.mode === "loading") return;
    (async () => {
      try {
        const data = await vault.listLogs(50);
        setLogs(data);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vault.mode]);

  return (
    <div>
      <div style={{ marginBottom: "40px" }}>
        <p className="text-xs tracking-widest uppercase" style={{ color: "var(--gold)" }}>Audit</p>
        <h1 className="font-display" style={{ fontSize: "2.4rem", color: "var(--text-primary)", marginTop: "8px" }}>
          Recognition Logs
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "8px" }}>
          Every recognition attempt recorded with full detail.
        </p>
      </div>

      {/* Column headings: wide screens only. On phones each row stacks onto two lines. */}
      <div
        className="hidden lg:grid lg:grid-cols-[1fr_100px_100px_160px] border-b"
        style={{ borderColor: "var(--gold-border)", padding: "10px 16px", gap: "16px" }}
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
        <div style={{ padding: "80px 16px", textAlign: "center" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>No recognition attempts yet.</span>
        </div>
      ) : (
        <div>
          {logs.map((log, i) => (
            <div
              key={log.id}
              className="grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_100px_100px_160px] border-b"
              style={{
                borderColor: "var(--gold-border)",
                padding: "16px",
                columnGap: "16px",
                rowGap: "8px",
                background: i % 2 === 0 ? "transparent" : "var(--surface)",
              }}
            >
              <span className="text-sm font-display" style={{ color: log.matched ? "var(--text-primary)" : "var(--text-muted)", minWidth: 0, overflowWrap: "anywhere" }}>
                {log.label || "—"}
              </span>
              <span className="justify-self-end lg:justify-self-start">
                <span
                  className="text-xs tracking-widest uppercase"
                  style={{
                    color: log.matched ? "var(--gold)" : "#b43c3c",
                    background: log.matched ? "var(--gold-dim)" : "rgba(180,60,60,0.1)",
                    padding: "4px 8px",
                  }}
                >
                  {log.matched ? "Match" : "No match"}
                </span>
              </span>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {log.confidence != null ? `${log.confidence.toFixed(1)}%` : "—"}
              </span>
              <span className="text-xs justify-self-end lg:justify-self-start" style={{ color: "var(--text-muted)" }}>
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
