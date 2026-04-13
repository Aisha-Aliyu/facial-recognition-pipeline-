import axios from "axios";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BACKEND,
  timeout: 30000,
});

// Helper — call this inside every function to get the Clerk token
async function getAuthHeader(): Promise<{ Authorization: string }> {
  // Import dynamically to avoid SSR issues
  const { useAuth } = await import("@clerk/nextjs");
  throw new Error("Use getToken from useAuth() hook in the component instead");
}

// ── Auth ──────────────────────────────────────────────
export async function syncUser(
  token: string,
  payload: { clerk_id: string; email: string; full_name?: string }
): Promise<void> {
  await api.post("/api/auth/sync", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Enroll ────────────────────────────────────────────
export async function enrollFace(
  token: string,
  label: string,
  file: File
): Promise<{ id: string; label: string; image_url: string; created_at: string }> {
  const form = new FormData();
  form.append("label", label);
  form.append("file", file);

  const res = await api.post("/api/faces/enroll", form, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ── Recognize ─────────────────────────────────────────
export async function recognizeFace(
  token: string,
  file: File
): Promise<{
  matched: boolean;
  confidence: number | null;
  label: string | null;
  face_id: string | null;
  message: string;
}[]> {
  const form = new FormData();
  form.append("file", file);

  const res = await api.post("/api/faces/recognize", form, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ── Profiles ──────────────────────────────────────────
export async function getProfiles(
  token: string
): Promise<{ id: string; label: string; image_url: string; created_at: string }[]> {
  const res = await api.get("/api/faces/", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function deleteProfile(token: string, profileId: string): Promise<void> {
  await api.delete(`/api/faces/${profileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Logs ──────────────────────────────────────────────
export async function getLogs(
  token: string,
  limit = 20
): Promise<{ id: string; matched: boolean; confidence: number | null; label: string | null; created_at: string }[]> {
  const res = await api.get(`/api/faces/logs?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
