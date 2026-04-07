"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useUser } from "@clerk/nextjs";
import { recognizeFace } from "@/lib/api";
import Image from "next/image";

export default function RecognizePage() {
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<{
    matched: boolean;
    confidence: number | null;
    label: string | null;
    message: string;
  } | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setStatus("idle");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const handleRecognize = async () => {
    if (!user || !file) return;
    setStatus("loading");
    setResult(null);
    try {
      const data = await recognizeFace(user.id, file);
      setStatus("success");
      setResult(data);
    } catch {
      setStatus("error");
      setResult({
        matched: false,
        confidence: null,
        label: null,
        message: "Recognition failed. Ensure the image has a clear, visible face.",
      });
    }
  };

  return (
    <div style={{ maxWidth: "640px" }}>
      <div style={{ marginBottom: "40px" }}>
        <p className="text-xs tracking-widest uppercase" style={{ color: "var(--gold)" }}>
          Recognize
        </p>
        <h1
          className="font-display"
          style={{ fontSize: "2.4rem", color: "var(--text-primary)", marginTop: "8px" }}
        >
          Run Recognition
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "8px" }}>
          Upload a photo and match it against every enrolled face in your vault.
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className="border cursor-pointer transition-all duration-200"
        style={{
          borderColor: isDragActive ? "var(--gold)" : "var(--gold-border)",
          borderStyle: "dashed",
          background: isDragActive ? "var(--gold-dim)" : "var(--surface)",
          padding: "48px 24px",
          textAlign: "center",
          marginBottom: "24px",
        }}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="flex flex-col items-center gap-4">
            <div style={{ width: "120px", height: "120px", position: "relative", border: "1px solid var(--gold-border)" }}>
              <Image src={preview} alt="query" fill style={{ objectFit: "cover" }} />
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {file?.name} · Click or drop to replace
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--gold)" }}>
              <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
              <circle cx="12" cy="12" r="3" />
              <path d="M9 9l-2-2M15 9l2-2M9 15l-2 2M15 15l2 2" />
            </svg>
            <div>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {isDragActive ? "Drop to analyze" : "Drag and drop or click to upload"}
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
        disabled={!file || status === "loading"}
        className="w-full text-xs tracking-widest uppercase transition-all duration-200"
        style={{
          background: !file || status === "loading" ? "var(--muted)" : "var(--gold)",
          color: "var(--void)",
          fontWeight: 500,
          padding: "16px",
          cursor: !file || status === "loading" ? "not-allowed" : "pointer",
          border: "none",
          fontFamily: "DM Mono, monospace",
        }}
      >
        {status === "loading" ? "Analyzing..." : "Run Recognition"}
      </button>

      {/* Result */}
      {result && (
        <div
          className="border"
          style={{
            marginTop: "32px",
            borderColor: result.matched ? "var(--gold)" : "#5a3a3a",
            background: result.matched ? "var(--gold-dim)" : "rgba(90,30,30,0.15)",
            padding: "28px",
          }}
        >
          <div className="flex items-center gap-3" style={{ marginBottom: "20px" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: result.matched ? "var(--gold)" : "#b43c3c",
                flexShrink: 0,
              }}
            />
            <span
              className="text-xs tracking-widest uppercase"
              style={{ color: result.matched ? "var(--gold)" : "#e07070" }}
            >
              {result.matched ? "Match Found" : "No Match"}
            </span>
          </div>

          {result.matched ? (
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)", marginBottom: "6px" }}>
                  Identity
                </div>
                <div className="font-display text-2xl" style={{ color: "var(--gold)" }}>
                  {result.label}
                </div>
              </div>
              <div>
                <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)", marginBottom: "6px" }}>
                  Confidence
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div
                    style={{
                      flex: 1,
                      height: "3px",
                      background: "var(--surface-raised)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${result.confidence ?? 0}%`,
                        background: "var(--gold)",
                        borderRadius: "2px",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                  <span className="font-display text-lg" style={{ color: "var(--gold)" }}>
                    {result.confidence?.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#e07070" }}>
              {result.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
