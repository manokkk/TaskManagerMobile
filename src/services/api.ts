import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from "../types/task";
import { Platform } from "react-native";

// Default host based on platform
const getDefaultBaseUrl = () => {
  if (Platform.OS === "android") {
    // 10.0.2.2 points to host machine from Android Emulator
    return "http://10.0.2.2:5000/api";
  }
  // iOS simulator or web
  return "http://localhost:5000/api";
};

let currentBaseUrl = getDefaultBaseUrl();

// Fallback in-memory demo data when backend is not reached
let localDemoTasks: Task[] = [
  {
    id: 1,
    title: "Design mobile wireframes",
    description: "Create high-fidelity screens for task manager in Figma",
    status: "completed",
    priority: "high",
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Setup Express + Prisma SQLite",
    description: "Initialize backend database schemas and REST endpoints",
    status: "in_progress",
    priority: "high",
    dueDate: new Date(Date.now() + 172800000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Connect NativeWind Tailwind styling",
    description: "Ensure Tailwind CSS classes render on iOS and Android devices",
    status: "pending",
    priority: "medium",
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const taskApi = {
  getBaseUrl(): string {
    return currentBaseUrl;
  },

  setBaseUrl(newUrl: string): void {
    currentBaseUrl = newUrl.trim().replace(/\/+$/, "");
  },

  async checkHealth(): Promise<{ online: boolean; message: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${currentBaseUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return { online: true, message: "Connected to Express Backend" };
      }
      return { online: false, message: `Server replied with ${res.status}` };
    } catch {
      return {
        online: false,
        message: "Offline (using local preview data)",
      };
    }
  },

  async getTasks(params?: { status?: string; priority?: string; search?: string }): Promise<Task[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const queryParams = new URLSearchParams();
      if (params?.status && params.status !== "all") queryParams.append("status", params.status);
      if (params?.priority && params.priority !== "all") queryParams.append("priority", params.priority);
      if (params?.search) queryParams.append("search", params.search);

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const res = await fetch(`${currentBaseUrl}/tasks${queryString}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Backend response error");
      return await res.json();
    } catch {
      // Fallback filter locally
      let filtered = [...localDemoTasks];
      if (params?.status && params.status !== "all") {
        filtered = filtered.filter((t) => t.status === params.status);
      }
      if (params?.priority && params.priority !== "all") {
        filtered = filtered.filter((t) => t.priority === params.priority);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (t) => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
        );
      }
      return filtered;
    }
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    try {
      const res = await fetch(`${currentBaseUrl}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create task on backend");
      return await res.json();
    } catch {
      const newTask: Task = {
        id: Date.now(),
        title: input.title,
        description: input.description || null,
        status: input.status || "pending",
        priority: input.priority || "medium",
        dueDate: input.dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localDemoTasks = [newTask, ...localDemoTasks];
      return newTask;
    }
  },

  async updateTask(id: number, input: UpdateTaskInput): Promise<Task> {
    try {
      const res = await fetch(`${currentBaseUrl}/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to update task on backend");
      return await res.json();
    } catch {
      const index = localDemoTasks.findIndex((t) => t.id === id);
      if (index !== -1) {
        localDemoTasks[index] = {
          ...localDemoTasks[index],
          ...input,
          updatedAt: new Date().toISOString(),
        };
        return localDemoTasks[index];
      }
      throw new Error("Task not found");
    }
  },

  async deleteTask(id: number): Promise<void> {
    try {
      const res = await fetch(`${currentBaseUrl}/tasks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task on backend");
    } catch {
      localDemoTasks = localDemoTasks.filter((t) => t.id !== id);
    }
  },
};

