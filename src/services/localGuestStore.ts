import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import {
  GalaxyStateResponse,
  GamificationMetadata,
  RankTier,
  Task,
  TaskCategory,
  TaskInput,
  UserProgress,
} from "../types/task";
import { TaskFilterParams } from "./api";

const GUEST_STORAGE_KEY = "galaxy_guest_tasks_v1";
const GUEST_FILE_URI = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}${GUEST_STORAGE_KEY}.json`
  : null;

const EXP_REWARDS: Readonly<Record<TaskCategory, number>> = {
  Daily: 30,
  Weekly: 20,
  Monthly: 10,
  Note: 0,
};

const METADATA: GamificationMetadata = {
  expRewards: { ...EXP_REWARDS },
  rankTiers: [
    { rank: "Rookie", levelRange: "Level 1 – 20", minLevel: 1, maxLevel: 20, insignia: "🛰️" },
    { rank: "Veteran", levelRange: "Level 21 – 40", minLevel: 21, maxLevel: 40, insignia: "🚀" },
    { rank: "Elite", levelRange: "Level 41 – 60", minLevel: 41, maxLevel: 60, insignia: "☄️" },
    { rank: "Master", levelRange: "Level 61 – 80", minLevel: 61, maxLevel: 80, insignia: "🌟" },
    { rank: "Legendary", levelRange: "Level 81 – 100", minLevel: 81, maxLevel: 100, insignia: "👑" },
  ],
  sampleLevelCaps: [
    { level: 1, cap: 100 },
    { level: 2, cap: 150 },
    { level: 3, cap: 225 },
    { level: 4, cap: 337 },
    { level: 5, cap: 505 },
    { level: 6, cap: 757 },
  ],
};

function getRankForLevel(level: number): RankTier {
  if (level <= 20) return "Rookie";
  if (level <= 40) return "Veteran";
  if (level <= 60) return "Elite";
  if (level <= 80) return "Master";
  return "Legendary";
}

function calculateGuestProgress(rawTotalExp: number): UserProgress {
  const totalExp = Math.max(0, Math.floor(rawTotalExp));
  let level = 1;
  let remainingExp = totalExp;
  let currentCap = 100;

  while (remainingExp >= currentCap && level < 100) {
    remainingExp -= currentCap;
    level += 1;
    currentCap = Math.floor(currentCap * 1.5);
  }

  const isMaxLevel = level >= 100 && remainingExp >= currentCap;
  const progressPercentage = isMaxLevel
    ? 100
    : Math.min(100, Math.max(0, Math.round((remainingExp / currentCap) * 100)));

  return {
    totalExp,
    level,
    currentLevelExp: remainingExp,
    nextLevelCap: currentCap,
    followingLevelCap: Math.floor(currentCap * 1.5),
    rank: getRankForLevel(level),
    progressPercentage,
  };
}

interface GuestStoreData {
  tasks: Task[];
  savedTotalExp: number;
  lastSettledDate: string;
}

function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function readGuestStoreRaw(): Promise<GuestStoreData> {
  const todayKey = getLocalDateKey();
  try {
    let raw: string | null = null;
    if (Platform.OS === "web" || !GUEST_FILE_URI) {
      if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
        raw = (globalThis as any).localStorage.getItem(GUEST_STORAGE_KEY);
      }
    } else {
      const info = await FileSystem.getInfoAsync(GUEST_FILE_URI);
      if (info.exists) {
        raw = await FileSystem.readAsStringAsync(GUEST_FILE_URI);
      }
    }

    if (!raw) {
      return { tasks: [], savedTotalExp: 0, lastSettledDate: todayKey };
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { tasks: parsed, savedTotalExp: 0, lastSettledDate: todayKey };
    }

    if (parsed && typeof parsed === "object") {
      return {
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        savedTotalExp:
          typeof parsed.savedTotalExp === "number" &&
            Number.isFinite(parsed.savedTotalExp)
            ? Math.max(0, Math.floor(parsed.savedTotalExp))
            : 0,
        lastSettledDate:
          typeof parsed.lastSettledDate === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(parsed.lastSettledDate)
            ? parsed.lastSettledDate
            : todayKey,
      };
    }

    return { tasks: [], savedTotalExp: 0, lastSettledDate: todayKey };
  } catch {
    return { tasks: [], savedTotalExp: 0, lastSettledDate: todayKey };
  }
}

async function writeGuestStore(data: GuestStoreData): Promise<void> {
  const serialized = JSON.stringify(data);
  try {
    if (Platform.OS === "web" || !GUEST_FILE_URI) {
      if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
        (globalThis as any).localStorage.setItem(GUEST_STORAGE_KEY, serialized);
      }
      return;
    }
    await FileSystem.writeAsStringAsync(GUEST_FILE_URI, serialized);
  } catch (err) {
    console.warn("Failed to persist local guest store:", err);
  }
}

/**
 * At the end of each local calendar day, adds EXP from all tasks completed
 * that day to savedTotalExp, persists progress, and unchecks completed tasks.
 */
async function readAndSettleGuestStore(): Promise<GuestStoreData> {
  const data = await readGuestStoreRaw();
  const todayKey = getLocalDateKey();

  if (data.lastSettledDate >= todayKey) {
    return data;
  }

  const earnedExp = data.tasks.reduce(
    (sum, t) =>
      t.category !== "Note" && t.status === "Done" ? sum + t.expReward : sum,
    0
  );

  const nowIso = new Date().toISOString();
  const nextTasks = data.tasks.map((t) =>
    t.category !== "Note" && t.status === "Done"
      ? {
        ...t,
        status: "Pending" as const,
        notificationId: null,
        updatedAt: nowIso,
      }
      : t
  );

  const settled: GuestStoreData = {
    tasks: nextTasks,
    savedTotalExp: data.savedTotalExp + earnedExp,
    lastSettledDate: todayKey,
  };

  await writeGuestStore(settled);
  return settled;
}

function buildGuestState(
  data: GuestStoreData,
  filter?: TaskFilterParams
): GalaxyStateResponse {
  const pendingExp = data.tasks.reduce(
    (sum, t) =>
      t.category !== "Note" && t.status === "Done" ? sum + t.expReward : sum,
    0
  );

  const nonNoteTasks = data.tasks.filter((t) => t.category !== "Note");

  const counts = {
    All: data.tasks.length,
    Daily: data.tasks.filter((t) => t.category === "Daily").length,
    Weekly: data.tasks.filter((t) => t.category === "Weekly").length,
    Monthly: data.tasks.filter((t) => t.category === "Monthly").length,
    Note: data.tasks.filter((t) => t.category === "Note").length,
    Completed: nonNoteTasks.filter((t) => t.status === "Done").length,
    Total: nonNoteTasks.length,
  };

  let filtered = [...data.tasks];
  if (filter?.category && filter.category !== "All") {
    filtered = filtered.filter((t) => t.category === filter.category);
  }
  if (filter?.status && filter.status !== "All") {
    filtered = filtered.filter((t) => t.status === filter.status);
  }
  if (filter?.search && filter.search.trim() !== "") {
    const q = filter.search.trim().toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }

  return {
    tasks: filtered,
    counts,
    progress: {
      ...calculateGuestProgress(data.savedTotalExp),
      pendingExp,
    },
    metadata: METADATA,
  };
}

export const localGuestStore = {
  async fetchState(filter?: TaskFilterParams): Promise<GalaxyStateResponse> {
    const data = await readAndSettleGuestStore();
    return buildGuestState(data, filter);
  },

  async createTask(
    input: TaskInput,
    filter?: TaskFilterParams
  ): Promise<{ task: Task; state: GalaxyStateResponse }> {
    const data = await readAndSettleGuestStore();
    const now = new Date().toISOString();
    const newTask: Task = {
      id: `guest_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      category: input.category,
      status: "Pending",
      scheduledAt: input.scheduledAt,
      notificationId: null,
      expReward: EXP_REWARDS[input.category],
      createdAt: now,
      updatedAt: now,
    };

    const nextData: GuestStoreData = {
      ...data,
      tasks: [newTask, ...data.tasks],
    };
    await writeGuestStore(nextData);
    return {
      task: newTask,
      state: buildGuestState(nextData, filter),
    };
  },

  async updateTask(
    id: string,
    input: Partial<TaskInput> & { notificationId?: string | null },
    filter?: TaskFilterParams
  ): Promise<{ task: Task; state: GalaxyStateResponse }> {
    const data = await readAndSettleGuestStore();
    let updatedTask: Task | null = null;
    const now = new Date().toISOString();

    const nextTasks = data.tasks.map((t) => {
      if (t.id !== id) return t;
      const nextCategory = input.category ?? t.category;
      updatedTask = {
        ...t,
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description.trim() || undefined }
          : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.scheduledAt !== undefined
          ? { scheduledAt: input.scheduledAt }
          : {}),
        ...(input.notificationId !== undefined
          ? { notificationId: input.notificationId }
          : {}),
        expReward: EXP_REWARDS[nextCategory],
        updatedAt: now,
      };
      return updatedTask;
    });

    if (!updatedTask) {
      throw new Error("Task not found in local guest storage");
    }

    const nextData: GuestStoreData = {
      ...data,
      tasks: nextTasks,
    };
    await writeGuestStore(nextData);
    return {
      task: updatedTask,
      state: buildGuestState(nextData, filter),
    };
  },

  async toggleTaskStatus(
    id: string,
    filter?: TaskFilterParams
  ): Promise<{ task: Task; state: GalaxyStateResponse }> {
    const data = await readAndSettleGuestStore();
    let toggledTask: Task | null = null;
    const now = new Date().toISOString();

    const nextTasks = data.tasks.map((t) => {
      if (t.id !== id) return t;
      const nextStatus = t.status === "Pending" ? "Done" : "Pending";
      toggledTask = {
        ...t,
        status: nextStatus,
        notificationId: nextStatus === "Done" ? null : t.notificationId,
        updatedAt: now,
      };
      return toggledTask;
    });

    if (!toggledTask) {
      throw new Error("Task not found in local guest storage");
    }

    const nextData: GuestStoreData = {
      ...data,
      tasks: nextTasks,
    };
    await writeGuestStore(nextData);
    return {
      task: toggledTask,
      state: buildGuestState(nextData, filter),
    };
  },

  async syncNotificationId(
    id: string,
    notificationId: string | null,
    filter?: TaskFilterParams
  ): Promise<{ task: Task; state: GalaxyStateResponse }> {
    return this.updateTask(id, { notificationId }, filter);
  },

  async deleteTask(
    id: string,
    filter?: TaskFilterParams
  ): Promise<{ deletedTask: Task; state: GalaxyStateResponse }> {
    const data = await readAndSettleGuestStore();
    const target = data.tasks.find((t) => t.id === id);
    if (!target) {
      throw new Error("Task not found in local guest storage");
    }

    const nextData: GuestStoreData = {
      ...data,
      tasks: data.tasks.filter((t) => t.id !== id),
    };
    await writeGuestStore(nextData);
    return {
      deletedTask: target,
      state: buildGuestState(nextData, filter),
    };
  },
};
