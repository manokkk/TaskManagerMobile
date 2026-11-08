export type TaskCategory = "Daily" | "Weekly" | "Monthly";
export type TaskStatus = "Pending" | "Done";
export type RankTier = "Rookie" | "Veteran" | "Elite" | "Master" | "Legendary";

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  status: TaskStatus;
  /** ISO-8601 timestamp representing the target Date & Time for local push notification */
  scheduledAt: string;
  /** OS notification identifier returned by expo-notifications */
  notificationId?: string | null;
  /** Authoritative EXP value assigned by the backend */
  expReward: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  category: TaskCategory;
  scheduledAt: string;
}

export interface UserProgress {
  totalExp: number;
  level: number;
  currentLevelExp: number;
  nextLevelCap: number;
  followingLevelCap: number;
  rank: RankTier;
  progressPercentage: number;
}

export interface RankTierDefinition {
  rank: RankTier;
  levelRange: string;
  minLevel: number;
  maxLevel: number;
  insignia: string;
}

export interface LevelCapSample {
  level: number;
  cap: number;
}

export interface GamificationMetadata {
  expRewards: Record<TaskCategory, number>;
  rankTiers: RankTierDefinition[];
  sampleLevelCaps: LevelCapSample[];
}

export interface TaskCounts {
  All: number;
  Daily: number;
  Weekly: number;
  Monthly: number;
  Completed: number;
  Total: number;
}

export interface GalaxyStateResponse {
  tasks: Task[];
  counts: TaskCounts;
  progress: UserProgress;
  metadata: GamificationMetadata;
}
