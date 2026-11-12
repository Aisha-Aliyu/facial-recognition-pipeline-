"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import Link from "next/link";
import { useVault } from "@/lib/vault";

export default function EnrollPage() {
  const vault = useVault();
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus("idle");
    setMessage("");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const busy = status === "loading" || vault.mode === "loading";
  const canSubmit = Boolean(file) && Boolean(label.trim()) && !busy;

  const handleSubmit = async () => {
    if (!file || !label.trim()) return;
    setStatus("loading");
    setMessage("");
    try {
      const result = await vault.enroll(label.trim(), file);
      setStatus("success");
      setMessage(
        vault.mode === "guest"
          ? `Enrolled ${result.label}. Saved in this browser only.`
          : `Enrolled ${result.label}.`
      );
      setFile(null);
      setPreview(null);
      setLabel("");
    } catch (err: unknown) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Enrollment failed. Make sure the image has a clear face."
      );
    }
  };

  return (
    <div style={{ maxWidth: "640px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p className="text-xs tracking-widest uppercase" style={{ color: "var(--gold)" }}>
          Enroll
        </p>
        <h1
          className="font-display"
          style={{ fontSize: "clamp(1.8rem, 6vw, 2.4rem)", color: "var(--text-primary)", marginTop: "8px", lineHeight: 1.15 }}
        >
          Add a Face Profile
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "8px", lineHeight: 1.7 }}>
          Upload a clear, well-lit photo with one face. InsightFace turns it into a
          512-number face embedding that recognition compares against.
        </p>
      </div>

      {/* Label input */}
      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="face-label"
          className="text-xs tracking-widest uppercase"
          style={{ color: "var(--text-muted)", display: "block", marginBottom: "10px" }}
        >
          Label / Name
        </label>
        <input
          id="face-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. John Doe"
          maxLength={100}
          className="w-full bg-transparent border text-sm outline-none transition-all duration-200 focus:border-[#bfa27a]"
          style={{
            borderColor: "var(--gold-border)",
            color: "var(--text-primary)",
            padding: "14px 16px",
            fontFamily: "DM Mono, monospace",
          }}
        />
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
        <input {...getInputProps()} aria-label="Face photo" />

        {preview ? (
          <div className="flex flex-col items-center gap-4">
            <div
              style={{
                width: "120px",
                height: "120px",
                position: "relative",
                border: "1px solid var(--gold-border)",
              }}
            >
              <Image src={preview} alt="Selected photo" fill unoptimized style={{ objectFit: "cover" }} />
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)", overflowWrap: "anywhere" }}>
              {file?.name} · Tap or drop to replace
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--gold)" }} aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {isDragActive ? "Drop the image here" : "Tap to choose a photo, or drag one here"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "6px" }}>
                JPEG, PNG, WebP · Max 5MB · One face
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full text-xs tracking-widest uppercase transition-all duration-200"
        style={{
          background: canSubmit ? "var(--gold)" : "var(--muted)",
          color: "var(--void)",
          fontWeight: 500,
          padding: "16px",
          cursor: canSubmit ? "pointer" : "not-allowed",
          border: "none",
          fontFamily: "DM Mono, monospace",
        }}
      >
        {status === "loading" ? "Reading the face…" : "Enroll Face"}
      </button>

      {/* Status message */}
      {message && (
        <div
          role={status === "error" ? "alert" : "status"}
          className="text-xs"
          style={{
            marginTop: "16px",
            padding: "14px 16px",
            lineHeight: 1.6,
            background: status === "success" ? "rgba(191,162,122,0.1)" : "rgba(180,60,60,0.1)",
            borderLeft: `2px solid ${status === "success" ? "var(--gold)" : "#b43c3c"}`,
            color: status === "success" ? "var(--gold)" : "#e07070",
          }}
        >
          {message}
          {status === "success" && (
            <>
              {" "}
              <Link href="/dashboard/recognize" style={{ textDecoration: "underline" }}>
                Now run recognition
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
