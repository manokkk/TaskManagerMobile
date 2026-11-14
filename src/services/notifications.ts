import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { TaskCategory } from "../types/task";

export const GALAXY_NOTIFICATION_CHANNEL_ID = "galaxy-task-reminders";

// Ensure notifications trigger visual alerts & sound even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface ScheduleTaskNotificationPayload {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  scheduledAt: string;
  /** Authoritative EXP reward provided by the backend */
  expReward: number;
}

export const notificationService = {
  /**
   * Requests OS-level notification permissions and configures high-priority
   * Android notification channels so alerts fire reliably in background/killed states.
   */
  async initializeAndRequestPermissions(): Promise<boolean> {
    if (Platform.OS === "web") {
      return false;
    }

    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync(
          GALAXY_NOTIFICATION_CHANNEL_ID,
          {
            name: "Galaxy Mission Reminders",
            description: "Scheduled alerts for Daily, Weekly, and Monthly missions",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 200, 250],
            lightColor: "#FF1493",
            lockscreenVisibility:
              Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: false,
          }
        );
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      return finalStatus === "granted";
    } catch {
      return false;
    }
  },

  /**
   * Schedules a local device push notification at the exact target Date & Time
   * using the backend-validated task payload.
   */
  async scheduleTaskNotification(
    payload: ScheduleTaskNotificationPayload
  ): Promise<string | null> {
    if (Platform.OS === "web" || payload.category === "Note") {
      return null;
    }

    const targetDate = new Date(payload.scheduledAt);
    const now = new Date();

    if (isNaN(targetDate.getTime()) || targetDate.getTime() <= now.getTime()) {
      return null;
    }

    const hasPermission = await this.initializeAndRequestPermissions();
    if (!hasPermission) {
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🌌 [${payload.category.toUpperCase()}] Mission Due (+${payload.expReward} EXP)`,
          body: payload.description
            ? `${payload.title} — ${payload.description}`
            : payload.title,
          data: {
            taskId: payload.id,
            category: payload.category,
            expReward: payload.expReward,
          },
          sound: "default",
          ...(Platform.OS === "android"
            ? {
                color: "#FF1493",
                channelId: GALAXY_NOTIFICATION_CHANNEL_ID,
              }
            : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: targetDate,
          ...(Platform.OS === "android"
            ? { channelId: GALAXY_NOTIFICATION_CHANNEL_ID }
            : {}),
        },
      });

      return notificationId;
    } catch {
      return null;
    }
  },

  /**
   * Cancels an existing pending device push notification if an identifier is stored.
   */
  async cancelTaskNotification(notificationId?: string | null): Promise<void> {
    if (!notificationId || Platform.OS === "web") {
      return;
    }
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // Ignore if notification already fired or was dismissed by OS
    }
  },

  /**
   * Atomically cancels any prior notification for a task and schedules a fresh one
   * if the backend reports the task is still Pending and its scheduledAt time is in the future.
   */
  async rescheduleTaskNotification(
    previousNotificationId: string | null | undefined,
    payload: ScheduleTaskNotificationPayload,
    isDone: boolean
  ): Promise<string | null> {
    await this.cancelTaskNotification(previousNotificationId);
    if (isDone) {
      return null;
    }
    return this.scheduleTaskNotification(payload);
  },
};
