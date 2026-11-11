import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export type MainViewTab = "all" | "tasks" | "notes" | "settings";

interface BottomNavBarProps {
  currentTab: MainViewTab;
  onSelectTab: (tab: MainViewTab) => void;
  allCount: number;
  tasksCount: number;
  notesCount: number;
  onPressAdd: () => void;
  bottomInset?: number;
  isSmallDevice?: boolean;
}

export const BottomNavBar = ({
  currentTab,
  onSelectTab,
  allCount,
  tasksCount,
  notesCount,
  onPressAdd,
  bottomInset = 0,
  isSmallDevice = false,
}: BottomNavBarProps) => {
  const isAllActive = currentTab === "all";
  const isTasksActive = currentTab === "tasks";
  const isNotesActive = currentTab === "notes";
  const isSettingsActive = currentTab === "settings";

  return (
    <View
      style={[
        styles.navContainer,
        {
          paddingBottom: Math.max(bottomInset, 8),
          height: (isSmallDevice ? 62 : 68) + Math.max(bottomInset, 8),
        },
      ]}
    >
      {/* Tab 1: All (Both Tasks with EXP and Notes) */}
      <TouchableOpacity
        onPress={() => onSelectTab("all")}
        style={styles.tabItem}
        activeOpacity={0.7}
      >
        <View style={isAllActive ? styles.activeIconBox : styles.inactiveIconBox}>
          <Text style={styles.tabIcon}>🌌</Text>
          {allCount > 0 && (
            <View
              style={isAllActive ? styles.activeBadge : styles.inactiveBadge}
              className="px-1.5 py-0.2 rounded-full absolute -top-1 -right-3"
            >
              <Text style={isAllActive ? styles.activeBadgeText : styles.inactiveBadgeText}>
                {allCount}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabLabel,
            isAllActive ? styles.activeLabel : styles.inactiveLabel,
          ]}
        >
          All
        </Text>
        {isAllActive && <View style={styles.activeDot} />}
      </TouchableOpacity>

      {/* Tab 2: Task (Tasks with EXP value: Daily, Weekly, Monthly) */}
      <TouchableOpacity
        onPress={() => onSelectTab("tasks")}
        style={styles.tabItem}
        activeOpacity={0.7}
      >
        <View style={isTasksActive ? styles.activeIconBox : styles.inactiveIconBox}>
          <Text style={styles.tabIcon}>🚀</Text>
          {tasksCount > 0 && (
            <View
              style={isTasksActive ? styles.activeBadge : styles.inactiveBadge}
              className="px-1.5 py-0.2 rounded-full absolute -top-1 -right-3"
            >
              <Text style={isTasksActive ? styles.activeBadgeText : styles.inactiveBadgeText}>
                {tasksCount}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabLabel,
            isTasksActive ? styles.activeLabel : styles.inactiveLabel,
          ]}
        >
          Task
        </Text>
        {isTasksActive && <View style={styles.activeDot} />}
      </TouchableOpacity>

      {/* Tab 3: Center Action FAB (+ New) */}
      <View style={styles.fabWrapper}>
        <TouchableOpacity
          onPress={onPressAdd}
          style={styles.centerFab}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create New Task or Note"
        >
          <Text style={styles.fabPlusIcon}>+</Text>
        </TouchableOpacity>
        <Text style={styles.fabLabel}>NEW</Text>
      </View>

      {/* Tab 4: Notes (Tasks not included in daily, weekly, or monthly) */}
      <TouchableOpacity
        onPress={() => onSelectTab("notes")}
        style={styles.tabItem}
        activeOpacity={0.7}
      >
        <View style={isNotesActive ? styles.activeIconBox : styles.inactiveIconBox}>
          <Text style={styles.tabIcon}>📝</Text>
          {notesCount > 0 && (
            <View
              style={isNotesActive ? styles.activeBadge : styles.inactiveBadge}
              className="px-1.5 py-0.2 rounded-full absolute -top-1 -right-3"
            >
              <Text style={isNotesActive ? styles.activeBadgeText : styles.inactiveBadgeText}>
                {notesCount}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabLabel,
            isNotesActive ? styles.activeLabel : styles.inactiveLabel,
          ]}
        >
          Notes
        </Text>
        {isNotesActive && <View style={styles.activeDot} />}
      </TouchableOpacity>

      {/* Tab 5: Settings (Log Out, User Profile, Database Status) */}
      <TouchableOpacity
        onPress={() => onSelectTab("settings")}
        style={styles.tabItem}
        activeOpacity={0.7}
      >
        <View style={isSettingsActive ? styles.activeIconBox : styles.inactiveIconBox}>
          <Text style={styles.tabIcon}>⚙️</Text>
        </View>
        <Text
          style={[
            styles.tabLabel,
            isSettingsActive ? styles.activeLabel : styles.inactiveLabel,
          ]}
        >
          Settings
        </Text>
        {isSettingsActive && <View style={styles.activeDot} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0B070B",
    borderTopWidth: 1.5,
    borderTopColor: "#FF1493",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
  },
  tabIcon: {
    fontSize: 18,
  },
  activeIconBox: {
    position: "relative",
  },
  inactiveIconBox: {
    position: "relative",
    opacity: 0.65,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  activeLabel: {
    color: "#FF1493",
    fontWeight: "900",
  },
  inactiveLabel: {
    color: "#FFB6C1",
    opacity: 0.6,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FF1493",
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: "#FF1493",
  },
  inactiveBadge: {
    backgroundColor: "#2E1122",
  },
  activeBadgeText: {
    color: "#000000",
    fontSize: 9,
    fontWeight: "900",
  },
  inactiveBadgeText: {
    color: "#FFB6C1",
    fontSize: 9,
    fontWeight: "bold",
  },
  fabWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    marginTop: -22,
  },
  centerFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FF1493",
    borderWidth: 2,
    borderColor: "#FF69B4",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10,
  },
  fabPlusIcon: {
    color: "#000000",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32,
    marginTop: -2,
  },
  fabLabel: {
    color: "#FF69B4",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 3,
  },
});
