import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Task } from "../types/task";

interface TaskCardProps {
  task: Task;
  isProcessing?: boolean;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  horizontalMargin?: number;
  isSmallDevice?: boolean;
}

function formatScheduledDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Unscheduled";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const TaskCard = ({
  task,
  isProcessing = false,
  onToggleStatus,
  onEdit,
  onDelete,
  horizontalMargin = 16,
  isSmallDevice = false,
}: TaskCardProps) => {
  const isDone = task.status === "Done";
  const isOverdue =
    !isDone && new Date(task.scheduledAt).getTime() < Date.now();

  return (
    <View
      style={[
        isDone ? styles.cardDone : styles.cardPending,
        { marginHorizontal: horizontalMargin },
      ]}
      className={`my-1.5 ${isSmallDevice ? "p-3" : "p-4"} rounded-2xl`}
    >
      <View className="flex-row items-start justify-between">
        {/* Interactive Galaxy Checkbox + Task Content */}
        <View className="flex-row items-start flex-1 mr-2">
          <TouchableOpacity
            onPress={() => onToggleStatus(task)}
            disabled={isProcessing}
            activeOpacity={0.75}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isDone, disabled: isProcessing }}
            style={isDone ? styles.checkboxChecked : styles.checkboxUnchecked}
            className="w-7 h-7 rounded-lg mr-3 mt-0.5 items-center justify-center"
          >
            {isDone ? (
              <Text className="text-black text-sm font-black leading-none">
                ✓
              </Text>
            ) : (
              <View className="w-2 h-2 rounded-full bg-[#FF1493]/30" />
            )}
          </TouchableOpacity>

          <View className="flex-1">
            <View className="flex-row items-center flex-wrap mb-1">
              <View
                style={styles.categoryBadge}
                className="px-2 py-0.5 rounded-full mr-1.5 mb-1"
              >
                <Text className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF1493]">
                  {task.category} • +{task.expReward} EXP
                </Text>
              </View>

              <View
                style={isDone ? styles.statusDoneBadge : styles.statusPendingBadge}
                className="px-2 py-0.5 rounded-full mb-1"
              >
                <Text
                  className={`text-[9px] font-bold uppercase ${
                    isDone ? "text-black" : "text-[#FF69B4]"
                  }`}
                >
                  {task.status}
                </Text>
              </View>
            </View>

            <Text
              className={`text-base font-bold mt-0.5 ${
                isDone ? "text-[#8A3B68] line-through" : "text-white"
              }`}
            >
              {task.title}
            </Text>

            {task.description ? (
              <Text
                className={`text-xs mt-1 leading-relaxed ${
                  isDone ? "text-[#8A3B68]/60" : "text-[#FFB6C1]/80"
                }`}
                numberOfLines={2}
              >
                {task.description}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Edit & Delete Actions */}
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => onEdit(task)}
            className="p-1.5 mr-1 rounded-lg bg-[#140710] border border-[#2E1122]"
            accessibilityLabel="Edit task"
          >
            <Text className="text-[#FF69B4] text-xs font-bold">✎</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDelete(task.id)}
            className="p-1.5 rounded-lg bg-[#140710] border border-[#2E1122]"
            accessibilityLabel="Delete task"
          >
            <Text className="text-[#FF1493] text-xs font-bold">✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer: Target Schedule & Push Notification Telemetry */}
      <View className="flex-row items-center justify-between mt-2.5 pt-2 border-t border-[#1F0B17]">
        <View className="flex-row items-center">
          <Text className="text-xs mr-1.5">
            {isDone ? "✨" : task.notificationId ? "🔔" : "⏰"}
          </Text>
          <Text
            className={`text-[11px] font-semibold ${
              isDone
                ? "text-[#8A3B68]"
                : isOverdue
                ? "text-[#FF1493]"
                : "text-[#FFB6C1]"
            }`}
          >
            {formatScheduledDateTime(task.scheduledAt)}
            {isOverdue ? " (Due)" : ""}
          </Text>
        </View>

        <Text className="text-[10px] font-bold uppercase tracking-wider text-[#FF69B4]">
          {isDone
            ? `Claimed +${task.expReward} EXP`
            : `Complete for +${task.expReward} EXP`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardPending: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#2E1122",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDone: {
    backgroundColor: "#050304",
    borderWidth: 1,
    borderColor: "#1A0913",
    opacity: 0.85,
  },
  checkboxUnchecked: {
    backgroundColor: "#000000",
    borderWidth: 2,
    borderColor: "#FF1493",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  checkboxChecked: {
    backgroundColor: "#FF1493",
    borderWidth: 2,
    borderColor: "#FF69B4",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  categoryBadge: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#FF1493",
  },
  statusPendingBadge: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  statusDoneBadge: {
    backgroundColor: "#FF69B4",
  },
});
