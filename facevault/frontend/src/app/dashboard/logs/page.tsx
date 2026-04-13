"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getLogs } from "@/lib/api";

type Log = {
  id: string;
  matched: boolean;
  confidence: number | null;
  label: string | null;
  created_at: string;
};

export default function LogsPage() {
  const { getToken } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await getLogs(token, 50);
        setLogs(data);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

      <div
        className="grid border-b"
        style={{ gridTemplateColumns: "1fr 100px 100px 160px", borderColor: "var(--gold-border)", padding: "10px 16px", gap: "16px" }}
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
              className="grid border-b"
              style={{
                gridTemplateColumns: "1fr 100px 100px 160px",
                borderColor: "var(--gold-border)",
                padding: "16px",
                gap: "16px",
                background: i % 2 === 0 ? "transparent" : "var(--surface)",
              }}
            >
              <span className="text-sm font-display" style={{ color: log.matched ? "var(--text-primary)" : "var(--text-muted)" }}>
                {log.label || "—"}
              </span>
              <span>
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
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
