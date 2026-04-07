import axios from "axios";

const api = axios.create({
  baseURL: "",
  timeout: 30000,
});

export async function enrollFace(
  clerkId: string,
  label: string,
  file: File
): Promise<{ id: string; label: string; image_url: string; created_at: string }> {
  const form = new FormData();
  form.append("clerk_id", clerkId);
  form.append("label", label);
  form.append("file", file);

  const res = await api.post("/api/faces/enroll", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function recognizeFace(
  clerkId: string,
  file: File
): Promise<{
  matched: boolean;
  confidence: number | null;
  distance: number | null;
  label: string | null;
  face_profile_id: string | null;
  message: string;
}> {
  const form = new FormData();
  form.append("clerk_id", clerkId);
  form.append("file", file);

  const res = await api.post("/api/faces/recognize", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function syncUser(payload: {
  clerk_id: string;
  email: string;
  full_name?: string;
}): Promise<void> {
  await api.post("/api/auth/sync", payload);
}

export async function getProfiles(
  clerkId: string,
  page = 1,
  perPage = 12
): Promise<{
  items: { id: string; label: string; image_url: string; model_used: string; created_at: string }[];
  total: number;
  page: number;
  per_page: number;
}> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(
    `${backendUrl}/api/faces/profiles?clerk_id=${clerkId}&page=${page}&per_page=${perPage}`
  );
  if (!res.ok) throw new Error("Failed to fetch profiles");
  return res.json();
}

export async function deleteProfile(clerkId: string, profileId: string): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(
    `${backendUrl}/api/faces/profiles/${profileId}?clerk_id=${clerkId}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete profile");
}

export async function getLogs(
  clerkId: string,
  limit = 20
): Promise<
  { id: string; matched: boolean; confidence: number | null; label: string | null; created_at: string }[]
> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(
    `${backendUrl}/api/faces/logs?clerk_id=${clerkId}&limit=${limit}`
  );
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}
