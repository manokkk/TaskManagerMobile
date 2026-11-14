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

async function readGuestTasks(): Promise<Task[]> {
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

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeGuestTasks(tasks: Task[]): Promise<void> {
  const serialized = JSON.stringify(tasks);
  try {
    if (Platform.OS === "web" || !GUEST_FILE_URI) {
      if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
        (globalThis as any).localStorage.setItem(GUEST_STORAGE_KEY, serialized);
      }
      return;
    }
    await FileSystem.writeAsStringAsync(GUEST_FILE_URI, serialized);
  } catch (err) {
    console.warn("Failed to persist local guest tasks:", err);
  }
}

function buildGuestState(
  allTasks: Task[],
  filter?: TaskFilterParams
): GalaxyStateResponse {
  const totalExp = allTasks.reduce(
    (sum, t) =>
      t.category !== "Note" && t.status === "Done" ? sum + t.expReward : sum,
    0
  );

  const nonNoteTasks = allTasks.filter((t) => t.category !== "Note");

  const counts = {
    All: allTasks.length,
    Daily: allTasks.filter((t) => t.category === "Daily").length,
    Weekly: allTasks.filter((t) => t.category === "Weekly").length,
    Monthly: allTasks.filter((t) => t.category === "Monthly").length,
    Note: allTasks.filter((t) => t.category === "Note").length,
    Completed: nonNoteTasks.filter((t) => t.status === "Done").length,
    Total: nonNoteTasks.length,
  };

  let filtered = [...allTasks];
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
    progress: calculateGuestProgress(totalExp),
    metadata: METADATA,
  };
}

export const localGuestStore = {
  async fetchState(filter?: TaskFilterParams): Promise<GalaxyStateResponse> {
    const tasks = await readGuestTasks();
    return buildGuestState(tasks, filter);
  },

  async createTask(
    input: TaskInput,
    filter?: TaskFilterParams
  ): Promise<{ task: Task; state: GalaxyStateResponse }> {
    const tasks = await readGuestTasks();
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

    const nextTasks = [newTask, ...tasks];
    await writeGuestTasks(nextTasks);
    return {
      task: newTask,
      state: buildGuestState(nextTasks, filter),
    };
  },

  async updateTask(
    id: string,
    input: Partial<TaskInput> & { notificationId?: string | null },
    filter?: TaskFilterParams
  ): Promise<{ task: Task; state: GalaxyStateResponse }> {
    const tasks = await readGuestTasks();
    let updatedTask: Task | null = null;
    const now = new Date().toISOString();

    const nextTasks = tasks.map((t) => {
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

    await writeGuestTasks(nextTasks);
    return {
      task: updatedTask,
      state: buildGuestState(nextTasks, filter),
    };
  },

  async toggleTaskStatus(
    id: string,
    filter?: TaskFilterParams
  ): Promise<{ task: Task; state: GalaxyStateResponse }> {
    const tasks = await readGuestTasks();
    let toggledTask: Task | null = null;
    const now = new Date().toISOString();

    const nextTasks = tasks.map((t) => {
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

    await writeGuestTasks(nextTasks);
    return {
      task: toggledTask,
      state: buildGuestState(nextTasks, filter),
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
    const tasks = await readGuestTasks();
    const target = tasks.find((t) => t.id === id);
    if (!target) {
      throw new Error("Task not found in local guest storage");
    }

    const nextTasks = tasks.filter((t) => t.id !== id);
    await writeGuestTasks(nextTasks);
    return {
      deletedTask: target,
      state: buildGuestState(nextTasks, filter),
    };
  },
};
