import "./global.css";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GalaxyStateResponse, Task, TaskInput } from "./src/types/task";
import { notificationService } from "./src/services/notifications";
import { galaxyApi } from "./src/services/api";
import { GalaxyHeader } from "./src/components/GalaxyHeader";
import {
  TaskFilter,
  CategoryFilterValue,
  StatusFilterValue,
} from "./src/components/TaskFilter";
import { TaskCard } from "./src/components/TaskCard";
import { CreateTaskModal } from "./src/components/CreateTaskModal";
import { RankProgressionModal } from "./src/components/RankProgressionModal";
import { useResponsiveLayout } from "./src/hooks/useResponsiveLayout";

/**
 * Default empty placeholder rendered strictly while awaiting the first backend response.
 * All authoritative EXP, level, cap, and rank computations happen on the backend.
 */
const EMPTY_SERVER_STATE: GalaxyStateResponse = {
  tasks: [],
  counts: {
    All: 0,
    Daily: 0,
    Weekly: 0,
    Monthly: 0,
    Completed: 0,
    Total: 0,
  },
  progress: {
    totalExp: 0,
    level: 1,
    currentLevelExp: 0,
    nextLevelCap: 100,
    followingLevelCap: 150,
    rank: "Rookie",
    progressPercentage: 0,
  },
  metadata: {
    expRewards: { Daily: 30, Weekly: 20, Monthly: 10 },
    rankTiers: [],
    sampleLevelCaps: [],
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <GalaxyQuestMain />
    </SafeAreaProvider>
  );
}

function GalaxyQuestMain() {
  const {
    isSmallDevice,
    isTablet,
    totalTopPadding,
    horizontalMargin,
    fabBottom,
    listBottomPadding,
    hudPadding,
    hudMarginBottom,
    maxContentWidth,
  } = useResponsiveLayout();

  const [serverState, setServerState] =
    useState<GalaxyStateResponse>(EMPTY_SERVER_STATE);
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilterValue>("All");
  const [selectedStatus, setSelectedStatus] =
    useState<StatusFilterValue>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [rankModalVisible, setRankModalVisible] = useState(false);
  const [apiConfigVisible, setApiConfigVisible] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(galaxyApi.getBaseUrl());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>(
    {}
  );

  // Client-side UI debounce lock so rapid taps don't spam overlapping HTTP requests
  const activeToggleLocksRef = useRef<Set<string>>(new Set());

  const currentFilter = useCallback(
    () => ({
      category: selectedCategory,
      status: selectedStatus,
      search: searchQuery,
    }),
    [selectedCategory, selectedStatus, searchQuery]
  );

  const syncWithBackend = useCallback(async () => {
    setLoading(true);
    try {
      const health = await galaxyApi.checkHealth();
      setBackendOnline(health.online);
      if (health.online) {
        const freshState = await galaxyApi.fetchState(currentFilter());
        setServerState(freshState);
      }
    } catch {
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }, [currentFilter]);

  // Initialize OS push permissions on mount
  useEffect(() => {
    let mounted = true;
    notificationService.initializeAndRequestPermissions().then((granted) => {
      if (mounted) setNotificationsEnabled(granted);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Re-fetch authoritative state from backend whenever filter/search changes
  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  const handleSaveTask = useCallback(
    async (input: TaskInput, existingTaskId?: string) => {
      try {
        if (existingTaskId) {
          const currentTask = serverState.tasks.find(
            (t) => t.id === existingTaskId
          );

          // 1. Update task on the authoritative backend
          const { task: updatedTask, state: nextState } =
            await galaxyApi.updateTask(existingTaskId, input, currentFilter());

          // 2. Reschedule local OS push notification using backend-returned task data
          const newNotificationId =
            await notificationService.rescheduleTaskNotification(
              currentTask?.notificationId,
              {
                id: updatedTask.id,
                title: updatedTask.title,
                description: updatedTask.description,
                category: updatedTask.category,
                scheduledAt: updatedTask.scheduledAt,
                expReward: updatedTask.expReward,
              },
              updatedTask.status === "Done"
            );

          if (newNotificationId !== updatedTask.notificationId) {
            const synced = await galaxyApi.syncNotificationId(
              updatedTask.id,
              newNotificationId,
              currentFilter()
            );
            setServerState(synced.state);
          } else {
            setServerState(nextState);
          }
        } else {
          // 1. Create task on the authoritative backend
          const { task: createdTask, state: nextState } =
            await galaxyApi.createTask(input, currentFilter());

          // 2. Schedule local OS push notification using backend-assigned ID & EXP reward
          const notificationId =
            await notificationService.scheduleTaskNotification({
              id: createdTask.id,
              title: createdTask.title,
              description: createdTask.description,
              category: createdTask.category,
              scheduledAt: createdTask.scheduledAt,
              expReward: createdTask.expReward,
            });

          if (notificationId) {
            const synced = await galaxyApi.syncNotificationId(
              createdTask.id,
              notificationId,
              currentFilter()
            );
            setServerState(synced.state);
          } else {
            setServerState(nextState);
          }
        }
        setBackendOnline(true);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Could not reach authoritative backend.";
        Alert.alert("Backend Error", message);
      }
    },
    [serverState.tasks, currentFilter]
  );

  const handleToggleStatus = useCallback(
    async (task: Task) => {
      if (activeToggleLocksRef.current.has(task.id)) {
        return;
      }

      activeToggleLocksRef.current.add(task.id);
      setProcessingIds((prev) => ({ ...prev, [task.id]: true }));

      try {
        // 1. Execute status toggle & EXP/Level math exclusively on the backend
        const { task: toggledTask, state: nextState } =
          await galaxyApi.toggleTaskStatus(task.id, currentFilter());

        // 2. Cancel or reschedule local OS push notification based on backend status
        const updatedNotificationId =
          await notificationService.rescheduleTaskNotification(
            task.notificationId,
            {
              id: toggledTask.id,
              title: toggledTask.title,
              description: toggledTask.description,
              category: toggledTask.category,
              scheduledAt: toggledTask.scheduledAt,
              expReward: toggledTask.expReward,
            },
            toggledTask.status === "Done"
          );

        if (updatedNotificationId !== toggledTask.notificationId) {
          const synced = await galaxyApi.syncNotificationId(
            toggledTask.id,
            updatedNotificationId,
            currentFilter()
          );
          setServerState(synced.state);
        } else {
          setServerState(nextState);
        }
        setBackendOnline(true);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to toggle mission on backend.";
        Alert.alert("Backend Error", message);
      } finally {
        activeToggleLocksRef.current.delete(task.id);
        setProcessingIds((prev) => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
      }
    },
    [currentFilter]
  );

  const handleDeleteTask = useCallback(
    async (id: string) => {
      try {
        const { deletedTask, state: nextState } = await galaxyApi.deleteTask(
          id,
          currentFilter()
        );
        if (deletedTask.notificationId) {
          await notificationService.cancelTaskNotification(
            deletedTask.notificationId
          );
        }
        setServerState(nextState);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to delete mission on backend.";
        Alert.alert("Backend Error", message);
      }
    },
    [currentFilter]
  );

  const handleSaveApiUrl = () => {
    galaxyApi.setBaseUrl(apiUrlInput);
    setApiConfigVisible(false);
    syncWithBackend();
  };

  return (
    <View className="flex-1 bg-black">
      {/* Dark theme status bar across iOS & Android */}
      <StatusBar style="light" />

      {/* Main Responsive Container */}
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: isTablet ? maxContentWidth : undefined,
          alignSelf: "center",
          paddingTop: totalTopPadding,
        }}
      >
        {/* RPG Level, EXP, & Rank Tier HUD (Rendered from Backend State) */}
        <GalaxyHeader
          progress={serverState.progress}
          completedCount={serverState.counts.Completed}
          totalCount={serverState.counts.Total}
          notificationsEnabled={notificationsEnabled}
          backendOnline={backendOnline}
          onPressRankInfo={() => setRankModalVisible(true)}
          onPressBackendConfig={() => {
            setApiUrlInput(galaxyApi.getBaseUrl());
            setApiConfigVisible(true);
          }}
          horizontalMargin={horizontalMargin}
          hudPadding={hudPadding}
          hudMarginBottom={hudMarginBottom}
          isSmallDevice={isSmallDevice}
        />

        {/* Search Bar */}
        <View
          style={{
            paddingHorizontal: horizontalMargin,
            marginTop: isSmallDevice ? 2 : 4,
          }}
        >
          <View
            style={[styles.searchBox, { height: isSmallDevice ? 40 : 44 }]}
            className="rounded-2xl px-3.5 flex-row items-center"
          >
            <Text className="text-[#FF1493] mr-2 text-xs">✦</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Scan galaxy missions..."
              placeholderTextColor="#8A3B68"
              className="flex-1 text-xs text-white p-0"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text className="text-[#FF69B4] font-bold text-xs">✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Category (Daily / Weekly / Monthly) & Status Filter */}
        <TaskFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          counts={serverState.counts}
          expRewards={serverState.metadata.expRewards}
          horizontalMargin={horizontalMargin}
          isSmallDevice={isSmallDevice}
        />

        {/* Mission List */}
        <FlatList
          data={serverState.tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              isProcessing={!!processingIds[item.id]}
              onToggleStatus={handleToggleStatus}
              onEdit={(task) => {
                setEditingTask(task);
                setModalVisible(true);
              }}
              onDelete={handleDeleteTask}
              horizontalMargin={horizontalMargin}
              isSmallDevice={isSmallDevice}
            />
          )}
          contentContainerStyle={{
            paddingBottom: listBottomPadding,
            paddingTop: 4,
          }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={syncWithBackend}
              tintColor="#FF1493"
              colors={["#FF1493"]}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-6">
              <Text className="text-3xl mb-2">🌌</Text>
              <Text className="text-base font-extrabold text-white">
                {backendOnline
                  ? "No Missions in Sector"
                  : "Awaiting Backend Connection"}
              </Text>
              <Text className="text-xs text-[#FFB6C1]/70 text-center mt-1">
                {!backendOnline
                  ? "Start TaskManagerBackend (port 5000) or tap 'Server Offline ⚙' above to configure your backend URL."
                  : searchQuery
                  ? `No tasks matching "${searchQuery}"`
                  : "Tap the neon + button below to deploy a Daily, Weekly, or Monthly mission."}
              </Text>
            </View>
          }
        />

        {/* Floating Neon Pink Action Button */}
        <View
          style={{
            position: "absolute",
            bottom: fabBottom,
            right: Math.max(20, horizontalMargin + 4),
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setEditingTask(null);
              setModalVisible(true);
            }}
            style={styles.fab}
            className="rounded-full items-center justify-center"
            activeOpacity={0.85}
            accessibilityLabel="Create new task"
          >
            <Text className="text-black text-3xl font-black leading-none mb-0.5">
              +
            </Text>
          </TouchableOpacity>
        </View>

        {/* Create / Edit Task Modal */}
        <CreateTaskModal
          visible={modalVisible}
          editingTask={editingTask}
          expRewards={serverState.metadata.expRewards}
          onClose={() => {
            setModalVisible(false);
            setEditingTask(null);
          }}
          onSubmit={handleSaveTask}
        />

        {/* RPG Rank & 1.5x Scaling Codex Modal */}
        <RankProgressionModal
          visible={rankModalVisible}
          progress={serverState.progress}
          metadata={serverState.metadata}
          onClose={() => setRankModalVisible(false)}
        />

        {/* Backend Endpoint Configuration Modal */}
        <Modal
          visible={apiConfigVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setApiConfigVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1 justify-center items-center bg-black/85 px-6"
          >
            <View
              style={styles.configCard}
              className="rounded-3xl p-5 w-full max-w-sm"
            >
              <Text className="text-[10px] font-bold uppercase tracking-widest text-[#FF69B4]">
                ✦ Security & Server Authority
              </Text>
              <Text className="text-lg font-black text-white mt-0.5 mb-1">
                Backend Endpoint
              </Text>
              <Text className="text-xs text-[#FFB6C1]/80 mb-3">
                All gamification math, EXP rewards, and task mutations execute
                on the backend server.
              </Text>

              {/* Quick Presets */}
              <View className="flex-row flex-wrap mb-3">
                <TouchableOpacity
                  onPress={() =>
                    setApiUrlInput("http://192.168.100.51:5000/api")
                  }
                  className="mr-2 mb-2 px-2.5 py-1 rounded-full bg-[#140710] border border-[#FF1493]"
                >
                  <Text className="text-[10px] font-bold text-[#FF69B4]">
                    📱 Wi-Fi: 192.168.100.51
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setApiUrlInput("http://10.0.2.2:5000/api")}
                  className="mr-2 mb-2 px-2.5 py-1 rounded-full bg-[#140710] border border-[#2E1122]"
                >
                  <Text className="text-[10px] font-bold text-[#FFB6C1]">
                    🤖 Emulator (10.0.2.2)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setApiUrlInput("http://localhost:5000/api")}
                  className="mb-2 px-2.5 py-1 rounded-full bg-[#140710] border border-[#2E1122]"
                >
                  <Text className="text-[10px] font-bold text-[#FFB6C1]">
                    💻 Localhost
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                value={apiUrlInput}
                onChangeText={setApiUrlInput}
                placeholder="http://192.168.100.51:5000/api"
                placeholderTextColor="#8A3B68"
                autoCapitalize="none"
                style={styles.searchBox}
                className="rounded-xl px-3.5 py-2.5 text-xs text-white mb-4 font-mono"
              />

              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setApiConfigVisible(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#140710] border border-[#2E1122] items-center mr-2"
                >
                  <Text className="text-xs font-bold text-[#FFB6C1]">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveApiUrl}
                  className="flex-1 py-2.5 rounded-xl bg-[#FF1493] items-center"
                >
                  <Text className="text-xs font-black text-black">Connect</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  configCard: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1.5,
    borderColor: "#FF1493",
  },
  fab: {
    width: 60,
    height: 60,
    backgroundColor: "#FF1493",
    borderWidth: 2,
    borderColor: "#FF69B4",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 10,
  },
});
