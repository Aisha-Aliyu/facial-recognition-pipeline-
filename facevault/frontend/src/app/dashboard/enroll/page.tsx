"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useUser } from "@clerk/nextjs";
import { enrollFace } from "@/lib/api";
import Image from "next/image";

export default function EnrollPage() {
  const { user } = useUser();
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

  const handleSubmit = async () => {
    if (!user || !file || !label.trim()) return;
    setStatus("loading");
    setMessage("");
    try {
      const result = await enrollFace(user.id, label.trim(), file);
      setStatus("success");
      setMessage(`Enrolled successfully: ${result.label}`);
      setFile(null);
      setPreview(null);
      setLabel("");
    } catch (err: unknown) {
      setStatus("error");
      const msg =
        err instanceof Error ? err.message : "Enrollment failed. Make sure the image has a clear face.";
      setMessage(msg);
    }
  };

  return (
    <div style={{ maxWidth: "640px" }}>
      <div style={{ marginBottom: "40px" }}>
        <p className="text-xs tracking-widest uppercase" style={{ color: "var(--gold)" }}>
          Enroll
        </p>
        <h1
          className="font-display"
          style={{ fontSize: "2.4rem", color: "var(--text-primary)", marginTop: "8px" }}
        >
          Add a Face Profile
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "8px" }}>
          Upload a clear, well-lit photo. One face per image. FaceNet512 will extract the embedding.
        </p>
      </div>

      {/* Label input */}
      <div style={{ marginBottom: "24px" }}>
        <label
          className="text-xs tracking-widest uppercase"
          style={{ color: "var(--text-muted)", display: "block", marginBottom: "10px" }}
        >
          Label / Name
        </label>
        <input
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
            <div
              style={{
                width: "120px",
                height: "120px",
                position: "relative",
                border: "1px solid var(--gold-border)",
              }}
            >
              <Image src={preview} alt="preview" fill style={{ objectFit: "cover" }} />
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {file?.name} · Click or drop to replace
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              style={{ color: "var(--gold)" }}
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {isDragActive ? "Drop the image here" : "Drag and drop or click to upload"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "6px" }}>
                JPEG, PNG, WebP · Max 5MB · One face
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!file || !label.trim() || status === "loading"}
        className="w-full text-xs tracking-widest uppercase transition-all duration-200"
        style={{
          background: !file || !label.trim() || status === "loading" ? "var(--muted)" : "var(--gold)",
          color: "var(--void)",
          fontWeight: 500,
          padding: "16px",
          cursor: !file || !label.trim() || status === "loading" ? "not-allowed" : "pointer",
          border: "none",
          fontFamily: "DM Mono, monospace",
        }}
      >
        {status === "loading" ? "Extracting Embedding..." : "Enroll Face"}
      </button>

      {/* Status message */}
      {message && (
        <div
          className="text-xs"
          style={{
            marginTop: "16px",
            padding: "14px 16px",
            background: status === "success" ? "rgba(191,162,122,0.1)" : "rgba(180,60,60,0.1)",
            borderLeft: `2px solid ${status === "success" ? "var(--gold)" : "#b43c3c"}`,
            color: status === "success" ? "var(--gold)" : "#e07070",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
