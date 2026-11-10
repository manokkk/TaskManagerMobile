import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { TaskCategory, TaskCounts, TaskStatus } from "../types/task";

export type CategoryFilterValue = "All" | TaskCategory;
export type StatusFilterValue = "All" | TaskStatus;

interface TaskFilterProps {
  selectedCategory: CategoryFilterValue;
  onSelectCategory: (category: CategoryFilterValue) => void;
  selectedStatus: StatusFilterValue;
  onSelectStatus: (status: StatusFilterValue) => void;
  counts: TaskCounts;
  expRewards: Record<TaskCategory, number>;
  horizontalMargin?: number;
  isSmallDevice?: boolean;
}

export const TaskFilter = ({
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  counts,
  expRewards,
  horizontalMargin = 16,
  isSmallDevice = false,
}: TaskFilterProps) => {
  const categories: {
    key: CategoryFilterValue;
    label: string;
    expTag?: string;
    count: number;
  }[] = [
    { key: "All", label: "All Missions", count: counts.All },
    {
      key: "Daily",
      label: "Daily",
      expTag: `+${expRewards.Daily} EXP`,
      count: counts.Daily,
    },
    {
      key: "Weekly",
      label: "Weekly",
      expTag: `+${expRewards.Weekly} EXP`,
      count: counts.Weekly,
    },
    {
      key: "Monthly",
      label: "Monthly",
      expTag: `+${expRewards.Monthly} EXP`,
      count: counts.Monthly,
    },
  ];

  const statuses: StatusFilterValue[] = ["All", "Pending", "Done"];

  return (
    <View style={{ marginVertical: isSmallDevice ? 4 : 6 }}>
      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: horizontalMargin,
          alignItems: "center",
        }}
      >
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              onPress={() => onSelectCategory(cat.key)}
              activeOpacity={0.8}
              style={isActive ? styles.activeTab : styles.inactiveTab}
              className={`mr-2 ${
                isSmallDevice ? "px-3 py-1.5 rounded-xl" : "px-3.5 py-2 rounded-2xl"
              } flex-row items-center`}
            >
              <Text
                className={`text-xs font-extrabold ${
                  isActive ? "text-black" : "text-[#FFB6C1]"
                }`}
              >
                {cat.label}
              </Text>

              {cat.expTag ? (
                <Text
                  className={`ml-1.5 text-[10px] font-bold ${
                    isActive ? "text-black/80" : "text-[#FF69B4]"
                  }`}
                >
                  {cat.expTag}
                </Text>
              ) : null}

              <View
                style={isActive ? styles.activeCountPill : styles.inactiveCountPill}
                className="ml-1.5 px-1.5 py-0.5 rounded-full"
              >
                <Text
                  className={`text-[10px] font-black ${
                    isActive ? "text-[#FF1493]" : "text-[#FF69B4]"
                  }`}
                >
                  {cat.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Status Sub-filter */}
      <View
        style={{
          paddingHorizontal: horizontalMargin,
          marginTop: isSmallDevice ? 6 : 8,
        }}
        className="flex-row items-center justify-between"
      >
        <Text className="text-[10px] font-bold uppercase tracking-widest text-[#8A3B68]">
          Status Filter
        </Text>
        <View className="flex-row items-center">
          {statuses.map((status) => {
            const isSelected = selectedStatus === status;
            return (
              <TouchableOpacity
                key={status}
                onPress={() => onSelectStatus(status)}
                style={
                  isSelected ? styles.activeStatusPill : styles.inactiveStatusPill
                }
                className="ml-1.5 px-2.5 py-0.5 rounded-full"
              >
                <Text
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isSelected ? "text-[#FF1493]" : "text-[#8A3B68]"
                  }`}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  activeTab: {
    backgroundColor: "#FF1493",
    borderWidth: 1,
    borderColor: "#FF69B4",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  inactiveTab: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  activeCountPill: {
    backgroundColor: "#000000",
  },
  inactiveCountPill: {
    backgroundColor: "#140710",
  },
  activeStatusPill: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#FF1493",
  },
  inactiveStatusPill: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#1F0B17",
  },
});
