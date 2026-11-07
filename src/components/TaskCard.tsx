import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Task, TaskPriority, TaskStatus } from "../types/task";

interface TaskCardProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onDelete: (id: number) => void;
}

const getPriorityBadge = (priority: TaskPriority) => {
  switch (priority) {
    case "high":
      return { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", label: "High" };
    case "medium":
      return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", label: "Medium" };
    case "low":
    default:
      return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", label: "Low" };
  }
};

const getStatusBadge = (status: TaskStatus) => {
  switch (status) {
    case "completed":
      return { bg: "bg-emerald-100", text: "text-emerald-800", label: "Completed" };
    case "in_progress":
      return { bg: "bg-blue-100", text: "text-blue-800", label: "In Progress" };
    case "pending":
    default:
      return { bg: "bg-slate-100", text: "text-slate-700", label: "Pending" };
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleStatus,
  onDelete,
}) => {
  const isCompleted = task.status === "completed";
  const priorityInfo = getPriorityBadge(task.priority);
  const statusInfo = getStatusBadge(task.status);

  return (
    <View className="bg-white mx-4 my-1.5 p-4 rounded-2xl border border-slate-100 shadow-sm">
      <View className="flex-row items-start justify-between">
        {/* Toggle Checkbox + Title */}
        <View className="flex-row items-start flex-1 mr-2">
          <TouchableOpacity
            onPress={() => onToggleStatus(task)}
            className={`w-6 h-6 rounded-full mr-3 items-center justify-center border-2 mt-0.5 ${
              isCompleted
                ? "bg-emerald-500 border-emerald-500"
                : task.status === "in_progress"
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-white"
            }`}
          >
            {isCompleted && (
              <Text className="text-white text-xs font-bold leading-none">✓</Text>
            )}
            {task.status === "in_progress" && (
              <View className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </TouchableOpacity>

          <View className="flex-1">
            <Text
              className={`text-base font-semibold ${
                isCompleted ? "text-slate-400 line-through" : "text-slate-800"
              }`}
            >
              {task.title}
            </Text>
            {task.description ? (
              <Text
                className={`text-xs mt-1 leading-relaxed ${
                  isCompleted ? "text-slate-300" : "text-slate-500"
                }`}
                numberOfLines={2}
              >
                {task.description}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          onPress={() => onDelete(task.id)}
          className="p-1 rounded-full active:bg-rose-50"
        >
          <Text className="text-slate-300 hover:text-rose-500 font-bold text-sm">✕</Text>
        </TouchableOpacity>
      </View>

      {/* Meta tags (Priority, Status, Date) */}
      <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-slate-50">
        <View className="flex-row items-center space-x-1.5">
          <View
            className={`px-2 py-0.5 rounded-full border ${priorityInfo.bg} ${priorityInfo.border}`}
          >
            <Text className={`text-[10px] font-semibold ${priorityInfo.text}`}>
              {priorityInfo.label}
            </Text>
          </View>

          <View className={`ml-1.5 px-2 py-0.5 rounded-full ${statusInfo.bg}`}>
            <Text className={`text-[10px] font-semibold ${statusInfo.text}`}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <Text className="text-[10px] text-slate-400">
          {new Date(task.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>
    </View>
  );
};

