import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";

interface TaskFilterProps {
  currentStatus: string;
  onSelectStatus: (status: string) => void;
  counts: {
    all: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
}

export const TaskFilter: React.FC<TaskFilterProps> = ({
  currentStatus,
  onSelectStatus,
  counts,
}) => {
  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "in_progress", label: "In Progress", count: counts.in_progress },
    { key: "completed", label: "Completed", count: counts.completed },
  ];

  return (
    <View className="my-2">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
        {tabs.map((tab) => {
          const isActive = currentStatus === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onSelectStatus(tab.key)}
              className={`mr-2 px-3.5 py-1.5 rounded-full flex-row items-center border ${
                isActive
                  ? "bg-indigo-600 border-indigo-600"
                  : "bg-white border-slate-200"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isActive ? "text-white" : "text-slate-600"
                }`}
              >
                {tab.label}
              </Text>
              <View
                className={`ml-1.5 px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-indigo-700" : "bg-slate-100"
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    isActive ? "text-indigo-100" : "text-slate-500"
                  }`}
                >
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

