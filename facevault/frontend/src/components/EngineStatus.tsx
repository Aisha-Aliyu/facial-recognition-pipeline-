"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "waking" | "ready" | "offline";

const MESSAGES: Record<Status, string> = {
  checking: "Checking the face engine...",
  waking: "Waking the face engine. After a quiet spell this takes about a minute.",
  ready: "Face engine ready",
  offline: "The face engine isn't answering right now. Try again in a few minutes.",
};

const HEALTH_URL = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/health`;
const CHECK_EVERY_MS = 5000;
const MAX_CHECKS = 30;
const KEEP_AWAKE_MS = 10 * 60 * 1000;

// The API runs on a free server that sleeps when nobody uses it. Start waking it as soon
// as the dashboard opens, show its status, and keep it awake while the tab is open.
export default function EngineStatus() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let checks = 0;

    const check = async () => {
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(HEALTH_URL, { cache: "no-store", signal: controller.signal });
        const body = res.ok ? await res.json() : null;
        if (body?.status === "ok") {
          if (!cancelled) setStatus("ready");
          checks = 0;
          timer = setTimeout(check, KEEP_AWAKE_MS);
          return;
        }
      } catch {
        // Still asleep or starting up
      } finally {
        clearTimeout(abortTimer);
      }
      if (cancelled) return;
      checks += 1;
      if (checks >= MAX_CHECKS) {
        setStatus("offline");
        return;
      }
      setStatus("waking");
      timer = setTimeout(check, CHECK_EVERY_MS);
    };

    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <p
      role="status"
      className="flex items-center gap-2 text-xs"
      style={{ color: status === "offline" ? "#e07070" : "var(--text-secondary)", lineHeight: 1.5 }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          flexShrink: 0,
          background:
            status === "ready" ? "var(--gold)" : status === "offline" ? "#b43c3c" : "var(--text-muted)",
        }}
      />
      {MESSAGES[status]}
    </p>
  );
}
