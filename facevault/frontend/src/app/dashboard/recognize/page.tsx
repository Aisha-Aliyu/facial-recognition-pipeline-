"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import Link from "next/link";
import { useVault, type VaultMatch } from "@/lib/vault";

type Status = "idle" | "loading" | "matched" | "no-match" | "error";

export default function RecognizePage() {
  const vault = useVault();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [matches, setMatches] = useState<VaultMatch[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMatches([]);
    setStatus("idle");
    setErrorMsg("");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const busy = status === "loading" || vault.mode === "loading";
  const canRun = Boolean(file) && !busy;

  const handleRecognize = async () => {
    if (!file) return;
    setStatus("loading");
    setMatches([]);
    setErrorMsg("");
    try {
      const results = await vault.recognize(file);
      setMatches(results);
      setStatus(results.length > 0 ? "matched" : "no-match");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Recognition failed. Try a clearer photo.");
    }
  };

  const needsEnroll = status === "error" && errorMsg.toLowerCase().includes("enroll");

  return (
    <div style={{ maxWidth: "640px" }}>
      <div style={{ marginBottom: "32px" }}>
        <p className="text-xs tracking-widest uppercase" style={{ color: "var(--gold)" }}>
          Recognize
        </p>
        <h1
          className="font-display"
          style={{ fontSize: "clamp(1.8rem, 6vw, 2.4rem)", color: "var(--text-primary)", marginTop: "8px", lineHeight: 1.15 }}
        >
          Run Recognition
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "8px", lineHeight: 1.7 }}>
          Upload a photo and match its main face against every face in your vault.
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className="border cursor-pointer transition-all duration-200 px-4 py-8 md:py-12"
        style={{
          borderColor: isDragActive ? "var(--gold)" : "var(--gold-border)",
          borderStyle: "dashed",
          background: isDragActive ? "var(--gold-dim)" : "var(--surface)",
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        <input {...getInputProps()} aria-label="Photo to recognize" />
        {preview ? (
          <div className="flex flex-col items-center gap-4">
            <div style={{ width: "120px", height: "120px", position: "relative", border: "1px solid var(--gold-border)" }}>
              <Image src={preview} alt="Photo to recognize" fill unoptimized style={{ objectFit: "cover" }} />
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)", overflowWrap: "anywhere" }}>
              {file?.name} · Tap or drop to replace
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--gold)" }} aria-hidden="true">
              <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
              <circle cx="12" cy="12" r="3" />
              <path d="M9 9l-2-2M15 9l2-2M9 15l-2 2M15 15l2 2" />
            </svg>
            <div>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {isDragActive ? "Drop to analyze" : "Tap to choose a photo, or drag one here"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "6px" }}>
                JPEG, PNG, WebP · Max 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Button */}
      <button
        onClick={handleRecognize}
        disabled={!canRun}
        className="w-full text-xs tracking-widest uppercase transition-all duration-200"
        style={{
          background: canRun ? "var(--gold)" : "var(--muted)",
          color: "var(--void)",
          fontWeight: 500,
          padding: "16px",
          cursor: canRun ? "pointer" : "not-allowed",
          border: "none",
          fontFamily: "DM Mono, monospace",
        }}
      >
        {status === "loading" ? "Analyzing…" : "Run Recognition"}
      </button>

      {/* No match */}
      {status === "no-match" && (
        <div
          role="status"
          style={{
            marginTop: "16px",
            padding: "14px 16px",
            background: "var(--surface)",
            borderLeft: "2px solid var(--gold-border)",
            color: "var(--text-secondary)",
            fontSize: "0.8rem",
            lineHeight: 1.6,
          }}
        >
          No match. The face in this photo doesn&apos;t look like anyone in your vault.
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div
          role="alert"
          style={{
            marginTop: "16px",
            padding: "14px 16px",
            background: "rgba(90,30,30,0.15)",
            borderLeft: "2px solid #b43c3c",
            color: "#e07070",
            fontSize: "0.8rem",
            lineHeight: 1.6,
          }}
        >
          {errorMsg}
          {needsEnroll && (
            <>
              {" "}
              <Link href="/dashboard/enroll" style={{ textDecoration: "underline" }}>
                Go to Enroll
              </Link>
            </>
          )}
        </div>
      )}

      {/* Results */}
      {matches.length > 0 && (
        <div style={{ marginTop: "28px" }}>
          <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)", marginBottom: "14px" }}>
            {matches.length} {matches.length === 1 ? "match" : "matches"} found
          </div>
          <ol style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--gold-border)" }}>
            {matches.map((m, i) => (
              <li
                key={m.id}
                className="flex items-center gap-3 md:gap-5 px-4 py-4 md:px-6 md:py-5"
                style={{ background: "var(--surface)" }}
              >
                <div className="font-display text-xl md:text-2xl" style={{ color: "var(--gold-dim)", minWidth: "20px" }}>
                  {i + 1}
                </div>

                {m.image_url ? (
                  <div style={{ width: "48px", height: "48px", position: "relative", flexShrink: 0 }}>
                    <Image
                      src={m.image_url}
                      alt={m.label}
                      fill
                      unoptimized={m.image_url.startsWith("data:")}
                      sizes="48px"
                      style={{ objectFit: "cover", filter: "grayscale(30%)" }}
                    />
                  </div>
                ) : (
                  <div style={{ width: "48px", height: "48px", background: "var(--muted)", border: "1px solid var(--gold-border)", flexShrink: 0 }} />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-display text-lg md:text-xl truncate" style={{ color: "var(--text-primary)" }}>
                    {m.label}
                  </div>
                  <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)", marginTop: "4px" }}>
                    Confidence
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="font-display text-xl md:text-2xl" style={{ color: "var(--gold)" }}>
                    {m.confidence.toFixed(1)}%
                  </div>
                  <div style={{ width: "64px", height: "2px", background: "var(--muted)", marginTop: "6px", marginLeft: "auto" }}>
                    <div style={{ width: `${Math.min(m.confidence, 100)}%`, height: "2px", background: "var(--gold)" }} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
