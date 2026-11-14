import { Platform } from "react-native";
import Constants from "expo-constants";
import {
  AuthResponse,
  AuthUser,
  GalaxyStateResponse,
  Task,
  TaskInput,
} from "../types/task";

const getDefaultBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (!__DEV__) {
    return "";
  }

  // If running in Expo Go or development client, dynamically resolve the host PC's Wi-Fi IP
  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (debuggerHost) {
    const hostIp = debuggerHost.split(":")[0];
    if (hostIp) {
      return `http://${hostIp}:5000/api`;
    }
  }

  // Fallback for Android Studio Emulator (10.0.2.2 maps to host PC localhost)
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000/api";
  }
  return "http://localhost:5000/api";
};

let currentBaseUrl = getDefaultBaseUrl();
let currentAuthToken: string | null = null;

export interface TaskFilterParams {
  category?: string;
  status?: string;
  search?: string;
}

function buildQueryString(params?: TaskFilterParams): string {
  if (!params) return "";
  const query = new URLSearchParams();
  if (params.category && params.category !== "All") {
    query.append("category", params.category);
  }
  if (params.status && params.status !== "All") {
    query.append("status", params.status);
  }
  if (params.search && params.search.trim() !== "") {
    query.append("search", params.search.trim());
  }
  const str = query.toString();
  return str ? `?${str}` : "";
}

function buildAuthHeaders(includeJson = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  if (currentAuthToken) {
    headers.Authorization = `Bearer ${currentAuthToken}`;
  }
  return headers;
}

function createApiError(message: string, status?: number): Error & { status?: number } {
  const err: Error & { status?: number } = new Error(message);
  if (status !== undefined) {
    err.status = status;
  }
  return err;
}

/**
 * Pure frontend HTTP client. All task validation, filtering, EXP calculation,
 * 1.5x level scaling, and rank tier resolution execute strictly on the backend.
 */
export const galaxyApi = {
  getBaseUrl(): string {
    return currentBaseUrl;
  },

  setBaseUrl(newUrl: string): void {
    if (!__DEV__) return;
    currentBaseUrl = newUrl.trim().replace(/\/+$/, "");
  },

  getAuthToken(): string | null {
    return currentAuthToken;
  },

  setAuthToken(token: string | null): void {
    currentAuthToken = token;
  },

  async checkHealth(timeoutMs = __DEV__ ? 3500 : 55000): Promise<{
    online: boolean;
    database: string;
    message: string;
  }> {
    if (!currentBaseUrl) {
      return {
        online: false,
        database: "unreachable",
        message: "Backend URL not configured (EXPO_PUBLIC_API_URL).",
      };
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${currentBaseUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          online: true,
          database: data.database || "connected",
          message: "Backend Connected",
        };
      }
      return {
        online: false,
        database: "offline",
        message: `HTTP ${res.status}`,
      };
    } catch {
      return {
        online: false,
        database: "unreachable",
        message: "Backend Unreachable",
      };
    }
  },

  async register(payload: {
    email: string;
    password: string;
    username?: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${currentBaseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw createApiError(data.error || "Registration failed", res.status);
    }
    return data;
  },

  async login(payload: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${currentBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw createApiError(data.error || "Authentication failed", res.status);
    }
    return data;
  },

  async getMe(token: string): Promise<{ user: AuthUser }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(`${currentBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw createApiError(data.error || "Session invalid", res.status);
      }
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async fetchState(
    filter?: TaskFilterParams
  ): Promise<GalaxyStateResponse> {
    const qs = buildQueryString(filter);
    const res = await fetch(`${currentBaseUrl}/tasks${qs}`, {
      headers: buildAuthHeaders(false),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw createApiError(
        errBody.error || `Failed to fetch state (${res.status})`,
        res.status
      );
    }
    return res.json();
  },

  async createTask(
    input: TaskInput,
    filter?: TaskFilterParams
  ): Promise<{ task: Task; state: GalaxyStateResponse }> {
    const qs = buildQueryString(filter);
    const res = await fetch(`${currentBaseUrl}/tasks${qs}`, {
      method: "POST",
      headers: buildAuthHeaders(true),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw createApiError(
        errBody.error || "Failed to create mission on server",
        res.status
      );
    }
    return res.json();
  },

  async updateTask(
    id: string,
    input: Partial<TaskInput> & { notificationId?: string | null },
    filter?: TaskFilterParams
  ): Promise<{ task: Task; state: GalaxyStateResponse }> {
    const qs = buildQueryString(filter);
    const res = await fetch(`${currentBaseUrl}/tasks/${id}${qs}`, {
      method: "PUT",
      headers: buildAuthHeaders(true),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw createApiError(
        errBody.error || "Failed to update mission on server",
        res.status
      );
    }
    return res.json();
  },

  async toggleTaskStatus(
    id: string,
    filter?: TaskFilterParams
  ): Promise<{ task: Task; state: GalaxyStateResponse }> {
    const qs = buildQueryString(filter);
    const res = await fetch(`${currentBaseUrl}/tasks/${id}/toggle${qs}`, {
      method: "PATCH",
      headers: buildAuthHeaders(false),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw createApiError(
        errBody.error || "Failed to toggle mission on server",
        res.status
      );
    }
    return res.json();
  },

  async syncNotificationId(
    id: string,
    notificationId: string | null,
    filter?: TaskFilterParams
  ): Promise<{ task: Task; state: GalaxyStateResponse }> {
    const qs = buildQueryString(filter);
    const res = await fetch(`${currentBaseUrl}/tasks/${id}/notification${qs}`, {
      method: "PATCH",
      headers: buildAuthHeaders(true),
      body: JSON.stringify({ notificationId }),
    });
    if (!res.ok) {
      throw createApiError(
        "Failed to sync notification ID with server",
        res.status
      );
    }
    return res.json();
  },

  async deleteTask(
    id: string,
    filter?: TaskFilterParams
  ): Promise<{ deletedTask: Task; state: GalaxyStateResponse }> {
    const qs = buildQueryString(filter);
    const res = await fetch(`${currentBaseUrl}/tasks/${id}${qs}`, {
      method: "DELETE",
      headers: buildAuthHeaders(false),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw createApiError(
        errBody.error || "Failed to delete mission on server",
        res.status
      );
    }
    return res.json();
  },
};
