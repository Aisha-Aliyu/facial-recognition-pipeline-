// Guest mode keeps the visitor's vault in this browser only. The server turns photos into
// embeddings and stores nothing, so guests can try FaceVault without an account.

export type GuestProfile = {
  id: string;
  label: string;
  embedding: number[];
  thumbnail: string;
  created_at: string;
};

export type GuestLog = {
  id: string;
  matched: boolean;
  label: string | null;
  confidence: number | null;
  created_at: string;
};

export type GuestMatch = {
  id: string;
  label: string;
  image_url: string;
  confidence: number;
};

type Store = { profiles: GuestProfile[]; logs: GuestLog[] };

const STORAGE_KEY = "facevault_guest_v1";
const MAX_PROFILES = 20;
const MAX_LOGS = 50;
// Same cosine similarity a match needs on the server
const MATCH_THRESHOLD = 0.4;

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function read(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Store>;
      return {
        profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
        logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      };
    }
  } catch {
    // Storage blocked or data unreadable, so start empty
  }
  return { profiles: [], logs: [] };
}

function write(store: Store): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    throw new Error("This browser won't let FaceVault save guest faces. Sign in to keep a vault instead.");
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// A small square preview, so the browser stores a thumbnail instead of the full photo
export async function makeThumbnail(file: File, size = 160): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read the image."));
      el.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare the image preview.");
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size
    );
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const guestVault = {
  profiles(): GuestProfile[] {
    return read().profiles;
  },

  add(label: string, embedding: number[], thumbnail: string): GuestProfile {
    const store = read();
    if (store.profiles.length >= MAX_PROFILES) {
      throw new Error(`Guest vaults hold up to ${MAX_PROFILES} faces. Delete one or sign in to keep more.`);
    }
    const profile: GuestProfile = {
      id: newId(),
      label,
      embedding,
      thumbnail,
      created_at: new Date().toISOString(),
    };
    write({ ...store, profiles: [profile, ...store.profiles] });
    return profile;
  },

  remove(id: string): void {
    const store = read();
    write({ ...store, profiles: store.profiles.filter((p) => p.id !== id) });
  },

  match(embedding: number[]): GuestMatch[] {
    return read()
      .profiles.map((p) => ({ profile: p, score: cosineSimilarity(embedding, p.embedding) }))
      .filter(({ score }) => score >= MATCH_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .map(({ profile, score }) => ({
        id: profile.id,
        label: profile.label,
        image_url: profile.thumbnail,
        confidence: Math.round(score * 10000) / 100,
      }));
  },

  logs(limit = MAX_LOGS): GuestLog[] {
    return read().logs.slice(0, limit);
  },

  addLog(best: GuestMatch | null): void {
    const store = read();
    const entry: GuestLog = {
      id: newId(),
      matched: best !== null,
      label: best?.label ?? null,
      confidence: best?.confidence ?? null,
      created_at: new Date().toISOString(),
    };
    write({ ...store, logs: [entry, ...store.logs].slice(0, MAX_LOGS) });
  },
};
