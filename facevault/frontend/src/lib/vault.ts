"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  deleteProfile,
  embedFace,
  enrollFace,
  getLogs,
  getProfiles,
  recognizeFace,
} from "@/lib/api";
import { guestVault, makeThumbnail } from "@/lib/guestVault";

export type VaultMode = "loading" | "account" | "guest";

export type VaultProfile = {
  id: string;
  label: string;
  image_url: string | null;
  created_at: string;
};

export type VaultMatch = {
  id: string;
  label: string;
  image_url: string | null;
  confidence: number;
};

export type VaultLog = {
  id: string;
  matched: boolean;
  label: string | null;
  confidence: number | null;
  created_at: string;
};

// One interface for both vaults: the account vault on the server when signed in, and
// the guest vault in this browser when not
export function useVault() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const mode: VaultMode = !isLoaded ? "loading" : isSignedIn ? "account" : "guest";

  const token = useCallback(async () => {
    const t = await getToken();
    if (!t) throw new Error("Your session expired. Please sign in again.");
    return t;
  }, [getToken]);

  return useMemo(
    () => ({
      mode,

      async enroll(label: string, file: File): Promise<VaultProfile> {
        if (mode === "account") return enrollFace(await token(), label, file);
        const embedding = await embedFace(file, "enroll");
        const thumbnail = await makeThumbnail(file);
        const profile = guestVault.add(label, embedding, thumbnail);
        return {
          id: profile.id,
          label: profile.label,
          image_url: profile.thumbnail,
          created_at: profile.created_at,
        };
      },

      async recognize(file: File): Promise<VaultMatch[]> {
        if (mode === "account") return recognizeFace(await token(), file);
        if (guestVault.profiles().length === 0) {
          throw new Error("No faces enrolled yet. Enroll a face first.");
        }
        const embedding = await embedFace(file, "recognize");
        const matches = guestVault.match(embedding);
        guestVault.addLog(matches[0] ?? null);
        return matches;
      },

      async listProfiles(): Promise<VaultProfile[]> {
        if (mode === "account") return getProfiles(await token());
        if (mode === "guest") {
          return guestVault.profiles().map((p) => ({
            id: p.id,
            label: p.label,
            image_url: p.thumbnail,
            created_at: p.created_at,
          }));
        }
        return [];
      },

      async removeProfile(id: string): Promise<void> {
        if (mode === "account") return deleteProfile(await token(), id);
        if (mode === "guest") guestVault.remove(id);
      },

      async listLogs(limit = 50): Promise<VaultLog[]> {
        if (mode === "account") return getLogs(await token(), limit);
        if (mode === "guest") return guestVault.logs(limit);
        return [];
      },
    }),
    [mode, token]
  );
}
