import axios, { AxiosError } from "axios";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BACKEND,
  timeout: 120000,
});

// ── Error Parser ──────────────────────────────────────
function parseError(err: unknown): string {
  if (err instanceof AxiosError) {
    if (err.code === "ECONNABORTED") {
      return "Request timed out. The server is warming up — please wait 30 seconds and try again.";
    }
    if (err.code === "ERR_NETWORK" || !err.response) {
      return "Cannot reach the server. It may be starting up — please wait 30 seconds and retry.";
    }
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d: { msg: string }) => d.msg).join(", ");

    const status = err.response?.status;
    if (status === 400) return "Invalid request. Check your image and label.";
    if (status === 401) return "Session expired. Please sign in again.";
    if (status === 413) return "Image too large. Max size is 5MB.";
    if (status === 422) return "No face detected. Use a clear, well-lit photo.";
    if (status === 429) return "Too many requests. Please wait a moment.";
    if (status === 500) return "Server error during face processing. Please try again.";
    if (status === 503) return "Server is starting up. Please wait 30 seconds and retry.";
  }
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
}

// ── Auth ──────────────────────────────────────────────
export async function syncUser(
  token: string,
  payload: { clerk_id: string; email: string; full_name?: string }
): Promise<void> {
  try {
    await api.post("/api/auth/sync", payload, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000,
    });
  } catch (err) {
    throw new Error(parseError(err));
  }
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

  try {
    const res = await api.post("/api/faces/enroll", form, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 120000, 
    });
    return res.data;
  } catch (err) {
    throw new Error(parseError(err));
  }
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

  try {
    const res = await api.post("/api/faces/recognize", form, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 120000, // explicit 2 min for ML processing
    });
    return res.data;
  } catch (err) {
    throw new Error(parseError(err));
  }
}

// ── Profiles ──────────────────────────────────────────
export async function getProfiles(
  token: string
): Promise<{ id: string; label: string; image_url: string; created_at: string }[]> {
  try {
    const res = await api.get("/api/faces/", {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000,
    });
    return res.data;
  } catch (err) {
    throw new Error(parseError(err));
  }
}

export async function deleteProfile(token: string, profileId: string): Promise<void> {
  try {
    await api.delete(`/api/faces/${profileId}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000,
    });
  } catch (err) {
    throw new Error(parseError(err));
  }
}

// ── Logs ──────────────────────────────────────────────
export async function getLogs(
  token: string,
  limit = 20
): Promise<{ id: string; matched: boolean; confidence: number | null; label: string | null; created_at: string }[]> {
  try {
    const res = await api.get(`/api/faces/logs?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000,
    });
    return res.data;
  } catch (err) {
    throw new Error(parseError(err));
  }
}

// ── Health ────────────────────────────────────────────
export async function checkHealth(): Promise<boolean> {
  try {
    await api.get("/api/health", { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}
