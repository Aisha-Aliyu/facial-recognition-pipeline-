"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

type Match = {
  label: string;
  confidence: number;
  image_url: string | null;
  face_id: string;
};

export default function RecognizePage() {
  const { getToken } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [matches, setMatches] = useState<Match[]>([]);
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

  const handleRecognize = async () => {
    if (!file) return;
    setStatus("loading");
    setMatches([]);
    setErrorMsg("");
    try {
      const token = await getToken();
      if (!token) {
        setStatus("error");
        setErrorMsg("Session expired. Please sign in again.");
        return;
      }
      const form = new FormData();
      form.append("file", file);
      const res = await axios.post<Match[]>(`${API}/api/faces/recognize`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Match[] = res.data;
      if (data.length === 0) {
        setStatus("error");
        setErrorMsg("No matches found above threshold.");
      } else {
        setStatus("success");
        setMatches(data);
      }
    } catch {
      setStatus("error");
      setErrorMsg("Recognition failed. Ensure the image has a clear, visible face.");
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

      {/* Error */}
      {status === "error" && (
        <div
          style={{
            marginTop: "16px",
            padding: "14px 16px",
            background: "rgba(90,30,30,0.15)",
            borderLeft: "2px solid #b43c3c",
            color: "#e07070",
            fontSize: "0.8rem",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Results */}
      {matches.length > 0 && (
        <div style={{ marginTop: "32px" }}>
          <div
            className="text-xs tracking-widest uppercase"
            style={{ color: "var(--text-muted)", marginBottom: "16px" }}
          >
            {matches.length} {matches.length === 1 ? "match" : "matches"} found
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--gold-border)" }}>
            {matches.map((m, i) => (
              <div
                key={m.face_id}
                style={{
                  background: "var(--surface)",
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                <div
                  className="font-display text-2xl"
                  style={{ color: "var(--gold-dim)", minWidth: "32px" }}
                >
                  {i + 1}
                </div>

                {m.image_url ? (
                  <div style={{ width: "48px", height: "48px", position: "relative", flexShrink: 0 }}>
                    <Image
                      src={m.image_url}
                      alt={m.label}
                      fill
                      style={{ objectFit: "cover", filter: "grayscale(30%)" }}
                    />
                  </div>
                ) : (
                  <div style={{ width: "48px", height: "48px", background: "var(--muted)", border: "1px solid var(--gold-border)", flexShrink: 0 }} />
                )}

                <div style={{ flex: 1 }}>
                  <div className="font-display text-xl" style={{ color: "var(--text-primary)" }}>
                    {m.label}
                  </div>
                  <div
                    className="text-xs tracking-widest uppercase"
                    style={{ color: "var(--text-muted)", marginTop: "4px" }}
                  >
                    Confidence
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div className="font-display text-2xl" style={{ color: "var(--gold)" }}>
                    {m.confidence.toFixed(1)}%
                  </div>
                  <div style={{ width: "80px", height: "2px", background: "var(--muted)", marginTop: "6px" }}>
                    <div
                      style={{
                        width: `${Math.min(m.confidence, 100)}%`,
                        height: "2px",
                        background: "var(--gold)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
