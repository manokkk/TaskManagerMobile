import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";
import { AuthUser } from "../types/task";

/** 7 days in milliseconds (7 * 24 * 60 * 60 * 1000 = 604,800,000 ms) */
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const SESSION_STORAGE_KEY = "galaxy_quest_auth_session_v1";
const LEGACY_SESSION_FILE_URI = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}${SESSION_STORAGE_KEY}.json`
  : null;

export interface StoredAuthSession {
  user: AuthUser;
  token: string;
  /** Timestamp (ms) when the user logged in */
  loginAt: number;
  /** Timestamp (ms) when the 7-day session expires and must reset */
  expiresAt: number;
}

export type SessionCheckResult =
  | { status: "valid"; session: StoredAuthSession }
  | { status: "expired" }
  | { status: "none" };

async function deleteLegacyFileSession(): Promise<void> {
  if (!LEGACY_SESSION_FILE_URI) return;
  try {
    const info = await FileSystem.getInfoAsync(LEGACY_SESSION_FILE_URI);
    if (info.exists) {
      await FileSystem.deleteAsync(LEGACY_SESSION_FILE_URI, { idempotent: true });
    }
  } catch {
    // Best-effort cleanup of legacy plaintext session file
  }
}

async function readRawSession(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
        return (globalThis as any).localStorage.getItem(SESSION_STORAGE_KEY);
      }
      return null;
    }

    const secureRaw = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
    if (secureRaw) {
      return secureRaw;
    }

    // One-time migration from legacy plaintext file storage into SecureStore
    if (LEGACY_SESSION_FILE_URI) {
      const info = await FileSystem.getInfoAsync(LEGACY_SESSION_FILE_URI);
      if (info.exists) {
        const legacyRaw = await FileSystem.readAsStringAsync(
          LEGACY_SESSION_FILE_URI
        );
        if (legacyRaw) {
          await SecureStore.setItemAsync(SESSION_STORAGE_KEY, legacyRaw);
          await deleteLegacyFileSession();
          return legacyRaw;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function writeRawSession(serialized: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
        (globalThis as any).localStorage.setItem(
          SESSION_STORAGE_KEY,
          serialized
        );
      }
      return;
    }

    await SecureStore.setItemAsync(SESSION_STORAGE_KEY, serialized);
    await deleteLegacyFileSession();
  } catch (err) {
    console.warn("Failed to persist 7-day auth session:", err);
  }
}

async function deleteRawSession(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
        (globalThis as any).localStorage.removeItem(SESSION_STORAGE_KEY);
      }
      return;
    }

    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
    await deleteLegacyFileSession();
  } catch (err) {
    console.warn("Failed to clear auth session:", err);
  }
}

export const sessionStorage = {
  /**
   * Saves a new 7-day login session starting from now.
   */
  async saveSession(
    user: AuthUser,
    token: string
  ): Promise<StoredAuthSession> {
    const now = Date.now();
    const session: StoredAuthSession = {
      user,
      token,
      loginAt: now,
      expiresAt: now + SESSION_DURATION_MS,
    };
    await writeRawSession(JSON.stringify(session));
    return session;
  },

  /**
   * Updates the stored user profile without extending the original 7-day expiration window.
   */
  async updateSessionUser(user: AuthUser): Promise<StoredAuthSession | null> {
    const raw = await readRawSession();
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as StoredAuthSession;
      if (!parsed || typeof parsed.expiresAt !== "number") {
        return null;
      }
      const updated: StoredAuthSession = {
        ...parsed,
        user,
      };
      await writeRawSession(JSON.stringify(updated));
      return updated;
    } catch {
      return null;
    }
  },

  /**
   * Checks if a stored 7-day session exists and whether it is still valid.
   * Automatically resets (deletes) the stored session if 7 days have passed.
   */
  async loadAndValidateSession(): Promise<SessionCheckResult> {
    const raw = await readRawSession();
    if (!raw) {
      return { status: "none" };
    }

    try {
      const parsed = JSON.parse(raw) as StoredAuthSession;
      if (
        !parsed ||
        !parsed.user ||
        !parsed.token ||
        typeof parsed.expiresAt !== "number" ||
        typeof parsed.loginAt !== "number"
      ) {
        await deleteRawSession();
        return { status: "none" };
      }

      const now = Date.now();
      // If 7 days have passed (or clock shows session expired), reset the session
      if (now >= parsed.expiresAt || now - parsed.loginAt >= SESSION_DURATION_MS) {
        await deleteRawSession();
        return { status: "expired" };
      }

      return { status: "valid", session: parsed };
    } catch {
      await deleteRawSession();
      return { status: "none" };
    }
  },

  /**
   * Resets/clears the stored session immediately.
   */
  async clearSession(): Promise<void> {
    await deleteRawSession();
  },

  /**
   * Formats the remaining time of the 7-day session for UI display.
   */
  getRemainingTimeInfo(expiresAt: number | null): {
    expired: boolean;
    days: number;
    hours: number;
    minutes: number;
    label: string;
  } {
    if (!expiresAt) {
      return {
        expired: true,
        days: 0,
        hours: 0,
        minutes: 0,
        label: "No active 7-day session",
      };
    }

    const diffMs = expiresAt - Date.now();
    if (diffMs <= 0) {
      return {
        expired: true,
        days: 0,
        hours: 0,
        minutes: 0,
        label: "Session expired — reset required",
      };
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);

    return {
      expired: false,
      days,
      hours,
      minutes,
      label: `${parts.join(" ")} left (7-day session)`,
    };
  },
};

