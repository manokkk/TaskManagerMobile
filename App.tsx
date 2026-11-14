import "./global.css";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ScrollView,
  Alert,
  StyleSheet,
  AppState,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GalaxyStateResponse, Task, TaskInput, AuthUser } from "./src/types/task";
import { notificationService } from "./src/services/notifications";
import { galaxyApi } from "./src/services/api";
import { localGuestStore } from "./src/services/localGuestStore";
import { sessionStorage } from "./src/services/sessionStorage";
import { GalaxyHeader } from "./src/components/GalaxyHeader";
import { DevBackendConfigModal } from "./src/components/DevBackendConfigModal";
import { SessionLoadingScreen } from "./src/components/SessionLoadingScreen";
import {
  CategoryFilterValue,
  StatusFilterValue,
} from "./src/components/TaskFilter";
import { TaskCard } from "./src/components/TaskCard";
import { CreateTaskModal } from "./src/components/CreateTaskModal";
import { NoteEditorModal } from "./src/components/NoteEditorModal";
import { RankProgressionModal } from "./src/components/RankProgressionModal";
import { AuthScreen } from "./src/screens/AuthScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { NotesScreen } from "./src/screens/NotesScreen";
import { BottomNavBar, MainViewTab } from "./src/components/BottomNavBar";
import { GalaxyIcon } from "./src/components/GalaxyIcon";
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
    Note: 0,
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
    expRewards: { Daily: 30, Weekly: 20, Monthly: 10, Note: 0 },
    rankTiers: [],
    sampleLevelCaps: [],
  },
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionCheckStatus, setSessionCheckStatus] = useState(
    "Checking 7-day login session..."
  );
  const [sessionResetNotice, setSessionResetNotice] = useState<string | null>(
    null
  );
  const [backendOnline, setBackendOnline] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<string>("checking...");

  const checkHealth = useCallback(async (timeoutMs?: number) => {
    try {
      const health = await galaxyApi.checkHealth(timeoutMs);
      setBackendOnline(health.online);
      setDatabaseStatus(
        health.database || (health.online ? "connected" : "unreachable")
      );
      return health.online;
    } catch {
      setBackendOnline(false);
      setDatabaseStatus("unreachable");
      return false;
    }
  }, []);

  const resetExpiredSession = useCallback(async () => {
    galaxyApi.setAuthToken(null);
    await sessionStorage.clearSession();
    setCurrentUser(null);
    setSessionExpiresAt(null);
    setIsGuest(false);
    setSessionResetNotice(
      "Your 7-day login session has expired and been reset. Please log in again."
    );
  }, []);

  // Verify the 7-day login session when the user opens the app
  useEffect(() => {
    let mounted = true;

    const bootstrapSession = async () => {
      setIsCheckingSession(true);
      setSessionCheckStatus("Checking 7-day login session...");

      const minDisplayDelay = new Promise((resolve) =>
        setTimeout(resolve, 900)
      );

      const [online, storedResult] = await Promise.all([
        checkHealth(4500),
        sessionStorage.loadAndValidateSession(),
        minDisplayDelay,
      ]);

      if (!mounted) return;

      if (!online) {
        // Wake up cold-started production backend in the background without blocking splash
        void checkHealth();
      }

      if (storedResult.status === "valid") {
        const { session } = storedResult;
        setSessionCheckStatus("7-day session active — restoring Command Deck...");
        galaxyApi.setAuthToken(session.token);

        if (online) {
          try {
            const { user: freshUser } = await galaxyApi.getMe(session.token);
            if (!mounted) return;
            await sessionStorage.updateSessionUser(freshUser);
            setCurrentUser(freshUser);
            setSessionExpiresAt(session.expiresAt);
          } catch (err: any) {
            if (!mounted) return;
            if (err?.status === 401 || err?.status === 404) {
              await resetExpiredSession();
            } else {
              // Network/transient failure: keep valid local 7-day session active
              setCurrentUser(session.user);
              setSessionExpiresAt(session.expiresAt);
            }
          }
        } else {
          setCurrentUser(session.user);
          setSessionExpiresAt(session.expiresAt);
        }
      } else if (storedResult.status === "expired") {
        await resetExpiredSession();
      } else {
        galaxyApi.setAuthToken(null);
        setCurrentUser(null);
        setSessionExpiresAt(null);
      }

      if (mounted) {
        setIsCheckingSession(false);
      }
    };

    bootstrapSession();

    return () => {
      mounted = false;
    };
  }, [checkHealth, resetExpiredSession]);

  // Automatically reset session and return straight to Log In page once 7 days elapse
  useEffect(() => {
    if (!currentUser || !sessionExpiresAt) return;

    const checkIfExpired = () => {
      if (Date.now() >= sessionExpiresAt) {
        resetExpiredSession();
      }
    };

    checkIfExpired();

    const intervalId = setInterval(checkIfExpired, 30000);
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (nextState === "active") {
          checkIfExpired();
        }
      }
    );

    return () => {
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  }, [currentUser, sessionExpiresAt, resetExpiredSession]);

  return (
    <SafeAreaProvider>
      {isCheckingSession ? (
        <SessionLoadingScreen statusMessage={sessionCheckStatus} />
      ) : !currentUser && !isGuest ? (
        <AuthScreen
          backendOnline={backendOnline}
          databaseStatus={databaseStatus}
          onRefreshHealth={checkHealth}
          sessionResetNotice={sessionResetNotice}
          onClearSessionNotice={() => setSessionResetNotice(null)}
          onLoginSuccess={async (user, token) => {
            galaxyApi.setAuthToken(token);
            const saved = await sessionStorage.saveSession(user, token);
            setSessionResetNotice(null);
            setSessionExpiresAt(saved.expiresAt);
            setCurrentUser(user);
          }}
          onContinueAsGuest={() => {
            galaxyApi.setAuthToken(null);
            setSessionResetNotice(null);
            setIsGuest(true);
          }}
        />
      ) : (
        <GalaxyQuestMain
          currentUser={currentUser}
          isGuest={isGuest}
          sessionExpiresAt={sessionExpiresAt}
          onSessionExpired={resetExpiredSession}
          onLogout={async () => {
            galaxyApi.setAuthToken(null);
            await sessionStorage.clearSession();
            setCurrentUser(null);
            setSessionExpiresAt(null);
            setIsGuest(false);
          }}
        />
      )}
    </SafeAreaProvider>
  );
}

interface GalaxyQuestMainProps {
  currentUser: AuthUser | null;
  isGuest: boolean;
  sessionExpiresAt: number | null;
  onSessionExpired: () => Promise<void>;
  onLogout: () => void;
}

function GalaxyQuestMain({
  currentUser,
  isGuest,
  sessionExpiresAt,
  onSessionExpired,
  onLogout,
}: GalaxyQuestMainProps) {
  const {
    isSmallDevice,
    isTablet,
    totalTopPadding,
    horizontalMargin,
    hudPadding,
    hudMarginBottom,
    maxContentWidth,
    bottomInset,
  } = useResponsiveLayout();

  const [serverState, setServerState] =
    useState<GalaxyStateResponse>(EMPTY_SERVER_STATE);
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<string>("connected");
  const [currentTab, setCurrentTab] = useState<MainViewTab>("all");

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilterValue>("All");
  const [selectedStatus, setSelectedStatus] =
    useState<StatusFilterValue>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [activeNote, setActiveNote] = useState<Task | null>(null);
  const [rankModalVisible, setRankModalVisible] = useState(false);
  const [apiConfigVisible, setApiConfigVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>(
    {}
  );

  // Client-side UI debounce lock so rapid taps don't spam overlapping HTTP requests
  const activeToggleLocksRef = useRef<Set<string>>(new Set());

  const handleSelectTab = useCallback(
    (tab: MainViewTab) => {
      setCurrentTab(tab);
      if (tab === "tasks" && selectedCategory === "Note") {
        setSelectedCategory("All");
      }
    },
    [selectedCategory]
  );

  const currentFilter = useCallback(
    () => ({
      category:
        currentTab === "notes"
          ? ("Note" as CategoryFilterValue)
          : currentTab === "tasks" && selectedCategory === "Note"
          ? ("All" as CategoryFilterValue)
          : selectedCategory,
      status: currentTab === "notes" ? ("All" as StatusFilterValue) : selectedStatus,
      search: currentTab === "notes" ? "" : searchQuery,
    }),
    [currentTab, selectedCategory, selectedStatus, searchQuery]
  );

  const dataStore = isGuest ? localGuestStore : galaxyApi;

  const syncWithBackend = useCallback(async () => {
    setLoading(true);
    try {
      if (isGuest) {
        const freshState = await localGuestStore.fetchState(currentFilter());
        setBackendOnline(true);
        setDatabaseStatus("local-guest");
        setServerState(freshState);
        return;
      }

      const health = await galaxyApi.checkHealth();
      setBackendOnline(health.online);
      setDatabaseStatus(health.database || (health.online ? "connected" : "unreachable"));
      if (health.online) {
        const freshState = await galaxyApi.fetchState(currentFilter());
        setServerState(freshState);
      }
    } catch (err: any) {
      if (!isGuest && err?.status === 401) {
        await onSessionExpired();
        return;
      }
      setBackendOnline(false);
      setDatabaseStatus("unreachable");
    } finally {
      setLoading(false);
    }
  }, [currentFilter, isGuest, onSessionExpired]);

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

          // 1. Update task on the active store (authenticated backend or local guest store)
          const { task: updatedTask, state: nextState } =
            await dataStore.updateTask(existingTaskId, input, currentFilter());

          // 2. Reschedule local OS push notification using returned task data
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
            const synced = await dataStore.syncNotificationId(
              updatedTask.id,
              newNotificationId,
              currentFilter()
            );
            setServerState(synced.state);
          } else {
            setServerState(nextState);
          }
        } else {
          // 1. Create task on the active store (authenticated backend or local guest store)
          const { task: createdTask, state: nextState } =
            await dataStore.createTask(input, currentFilter());

          // 2. Schedule local OS push notification using assigned ID & EXP reward
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
            const synced = await dataStore.syncNotificationId(
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
      } catch (err: any) {
        if (!isGuest && err?.status === 401) {
          await onSessionExpired();
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Could not save mission.";
        Alert.alert(isGuest ? "Storage Error" : "Backend Error", message);
      }
    },
    [serverState.tasks, currentFilter, dataStore, isGuest, onSessionExpired]
  );

  const handleToggleStatus = useCallback(
    async (task: Task) => {
      if (activeToggleLocksRef.current.has(task.id)) {
        return;
      }

      activeToggleLocksRef.current.add(task.id);
      setProcessingIds((prev) => ({ ...prev, [task.id]: true }));

      try {
        // 1. Execute status toggle & EXP/Level math on the active store
        const { task: toggledTask, state: nextState } =
          await dataStore.toggleTaskStatus(task.id, currentFilter());

        // 2. Cancel or reschedule local OS push notification based on status
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
          const synced = await dataStore.syncNotificationId(
            toggledTask.id,
            updatedNotificationId,
            currentFilter()
          );
          setServerState(synced.state);
          setActiveNote((prev) =>
            prev && prev.id === synced.task.id ? synced.task : prev
          );
        } else {
          setServerState(nextState);
          setActiveNote((prev) =>
            prev && prev.id === toggledTask.id ? toggledTask : prev
          );
        }
        setBackendOnline(true);
      } catch (err: any) {
        if (!isGuest && err?.status === 401) {
          await onSessionExpired();
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Failed to toggle mission status.";
        Alert.alert(isGuest ? "Storage Error" : "Backend Error", message);
      } finally {
        activeToggleLocksRef.current.delete(task.id);
        setProcessingIds((prev) => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
      }
    },
    [currentFilter, dataStore, isGuest, onSessionExpired]
  );

  const handleDeleteTask = useCallback(
    async (id: string) => {
      try {
        const { deletedTask, state: nextState } = await dataStore.deleteTask(
          id,
          currentFilter()
        );
        if (deletedTask.notificationId) {
          await notificationService.cancelTaskNotification(
            deletedTask.notificationId
          );
        }
        setServerState(nextState);
      } catch (err: any) {
        if (!isGuest && err?.status === 401) {
          await onSessionExpired();
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Failed to delete mission.";
        Alert.alert(isGuest ? "Storage Error" : "Backend Error", message);
      }
    },
    [currentFilter, dataStore, isGuest, onSessionExpired]
  );

  const handleSaveNoteContent = useCallback(
    async (noteId: string, updates: { title: string; description: string }) => {
      try {
        const { task: updatedTask, state: nextState } = await dataStore.updateTask(
          noteId,
          {
            title: updates.title,
            description: updates.description,
          },
          currentFilter()
        );
        setServerState(nextState);
        setActiveNote((prev) =>
          prev && prev.id === updatedTask.id ? updatedTask : prev
        );
        setBackendOnline(true);
      } catch (err: any) {
        if (!isGuest && err?.status === 401) {
          await onSessionExpired();
        }
        throw err;
      }
    },
    [currentFilter, dataStore, isGuest, onSessionExpired]
  );

  const resolvedActiveNote = activeNote
    ? serverState.tasks.find((t) => t.id === activeNote.id) ?? activeNote
    : null;

  return (
    <View className="flex-1 bg-black">
      {/* Dark theme status bar across iOS & Android */}
      <StatusBar style="light" />

      {currentTab === "settings" ? (
        <SettingsScreen
          currentUser={currentUser}
          isGuest={isGuest}
          sessionExpiresAt={sessionExpiresAt}
          progress={serverState.progress}
          backendOnline={backendOnline}
          databaseStatus={databaseStatus}
          onLogout={onLogout}
          onRefreshHealth={syncWithBackend}
        />
      ) : currentTab === "notes" ? (
        <NotesScreen
          notes={serverState.tasks.filter((t) => t.category === "Note")}
          loading={loading}
          onRefresh={syncWithBackend}
          onOpenNote={(note) => {
            setActiveNote(note);
          }}
          onDeleteNote={handleDeleteTask}
          onAddNewNote={() => {
            setEditingTask(null);
            setModalVisible(true);
          }}
        />
      ) : (
        /* Main Responsive Container */
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
            onPressBackendConfig={
              __DEV__ && !isGuest ? () => setApiConfigVisible(true) : undefined
            }
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
            <View className="flex-row items-center mb-1.5">
              <View className="mr-1.5">
                <GalaxyIcon name="sparkles" size={11} color="#FF69B4" />
              </View>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-[#FF69B4]">
                {currentTab === "all"
                  ? "Galaxy Directives • All Tasks & Notes"
                  : "EXP Missions • Daily, Weekly & Monthly"}
              </Text>
            </View>
            <View
              style={[styles.searchBox, { height: isSmallDevice ? 40 : 44 }]}
              className="rounded-2xl px-3.5 flex-row items-center"
            >
              <View className="mr-2">
                <GalaxyIcon name="search" size={14} color="#FF1493" />
              </View>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={
                  currentTab === "all"
                    ? "Scan all tasks & notes..."
                    : "Scan EXP missions..."
                }
                placeholderTextColor="#8A3B68"
                className="flex-1 text-xs text-white p-0"
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <GalaxyIcon name="close" size={14} color="#FF69B4" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Category Filter Pills */}
          <View
            style={{
              paddingHorizontal: horizontalMargin,
              marginTop: isSmallDevice ? 4 : 6,
            }}
            className="flex-row items-center"
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(currentTab === "all"
                ? ([
                    { key: "All", label: "All", count: serverState.counts.All },
                    { key: "Daily", label: "Daily", count: serverState.counts.Daily },
                    { key: "Weekly", label: "Weekly", count: serverState.counts.Weekly },
                    { key: "Monthly", label: "Monthly", count: serverState.counts.Monthly },
                    { key: "Note", label: "Notes", count: serverState.counts.Note || 0 },
                  ] as const)
                : ([
                    {
                      key: "All",
                      label: "All",
                      count:
                        serverState.counts.Daily +
                        serverState.counts.Weekly +
                        serverState.counts.Monthly,
                    },
                    { key: "Daily", label: "Daily", count: serverState.counts.Daily },
                    { key: "Weekly", label: "Weekly", count: serverState.counts.Weekly },
                    { key: "Monthly", label: "Monthly", count: serverState.counts.Monthly },
                  ] as const)
              ).map((cat) => {
                const isSelected = selectedCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => setSelectedCategory(cat.key as CategoryFilterValue)}
                    style={
                      isSelected
                        ? styles.activeCategoryPill
                        : styles.inactiveCategoryPill
                    }
                    className="mr-2 px-3 py-1.5 rounded-full flex-row items-center"
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? "text-black font-black" : "text-[#FFB6C1]"
                      }`}
                    >
                      {cat.label}
                    </Text>
                    {cat.count > 0 && (
                      <View
                        style={
                          isSelected
                            ? styles.activeCountBadge
                            : styles.inactiveCountBadge
                        }
                        className="ml-1.5 px-1.5 py-0.2 rounded-full"
                      >
                        <Text
                          className={`text-[9px] font-black ${
                            isSelected ? "text-white" : "text-[#FF69B4]"
                          }`}
                        >
                          {cat.count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

        {/* Status Filter Pills */}
        <View
          style={{
            paddingHorizontal: horizontalMargin,
            marginTop: isSmallDevice ? 4 : 6,
            marginBottom: isSmallDevice ? 4 : 6,
          }}
          className="flex-row items-center justify-between"
        >
          <Text className="text-[10px] font-bold uppercase tracking-widest text-[#8A3B68]">
            Status:
          </Text>
          <View className="flex-row items-center">
            {(["All", "Pending", "Done"] as StatusFilterValue[]).map((status) => {
              const isSelected = selectedStatus === status;
              const statusColor = isSelected ? "#FF1493" : "#8A3B68";
              return (
                <TouchableOpacity
                  key={status}
                  onPress={() => setSelectedStatus(status)}
                  style={
                    isSelected
                      ? styles.activeStatusPill
                      : styles.inactiveStatusPill
                  }
                  className="ml-1.5 px-3 py-1 rounded-full flex-row items-center"
                  activeOpacity={0.7}
                >
                  {status === "Pending" && (
                    <View className="mr-1">
                      <GalaxyIcon name="clock" size={10} color={statusColor} />
                    </View>
                  )}
                  {status === "Done" && (
                    <View className="mr-1">
                      <GalaxyIcon name="check" size={10} color={statusColor} />
                    </View>
                  )}
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

        {/* Task List */}
        <FlatList
          data={
            currentTab === "tasks"
              ? serverState.tasks.filter((t) => t.category !== "Note")
              : serverState.tasks
          }
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              isProcessing={!!processingIds[item.id]}
              onToggleStatus={handleToggleStatus}
              onEdit={(task) => {
                if (task.category === "Note") {
                  setActiveNote(task);
                } else {
                  setEditingTask(task);
                  setModalVisible(true);
                }
              }}
              onOpenNote={(note) => setActiveNote(note)}
              onDelete={handleDeleteTask}
              horizontalMargin={horizontalMargin}
              isSmallDevice={isSmallDevice}
            />
          )}
          contentContainerStyle={{
            paddingBottom: (isSmallDevice ? 85 : 95) + Math.max(bottomInset, 8),
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
              <View className="mb-3">
                <GalaxyIcon
                  name={currentTab === "all" ? "galaxy" : "rocket"}
                  size={36}
                  color="#FF1493"
                />
              </View>
              <Text className="text-base font-extrabold text-white">
                {backendOnline
                  ? currentTab === "all"
                    ? "No Directives in Sector"
                    : "No Missions in Sector"
                  : "Awaiting Backend Connection"}
              </Text>
              <Text className="text-xs text-[#FFB6C1]/70 text-center mt-1">
                {!backendOnline
                  ? "Start TaskManagerBackend (port 5000) or tap 'Server Offline' above to configure your backend URL."
                  : searchQuery
                  ? `No items matching "${searchQuery}"`
                  : currentTab === "all"
                  ? "Tap the neon + button below to create a Task or Note."
                  : "Tap the neon + button below to deploy a Daily, Weekly, or Monthly mission."}
              </Text>
            </View>
          }
        />
        </View>
      )}

      {/* Docked Cyberpunk Bottom Navigation Bar */}
      <BottomNavBar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        allCount={serverState.counts.All}
        tasksCount={
          serverState.counts.Daily +
          serverState.counts.Weekly +
          serverState.counts.Monthly
        }
        notesCount={serverState.counts.Note || 0}
        onPressAdd={() => {
          setEditingTask(null);
          setModalVisible(true);
        }}
        bottomInset={bottomInset}
        isSmallDevice={isSmallDevice}
      />

        {/* Create / Edit Task Modal */}
        <CreateTaskModal
          visible={modalVisible}
          editingTask={editingTask}
          expRewards={serverState.metadata.expRewards}
          defaultCategory={currentTab === "notes" ? "Note" : "Daily"}
          noteOnly={currentTab === "notes" && !editingTask}
          onClose={() => {
            setModalVisible(false);
            setEditingTask(null);
          }}
          onSubmit={handleSaveTask}
        />

        {/* Full-Screen Device-Style Notepad Editor for Notes */}
        <NoteEditorModal
          visible={!!resolvedActiveNote}
          note={resolvedActiveNote}
          onClose={() => setActiveNote(null)}
          onSave={handleSaveNoteContent}
          onDelete={handleDeleteTask}
        />

        {/* RPG Rank & 1.5x Scaling Codex Modal */}
        <RankProgressionModal
          visible={rankModalVisible}
          progress={serverState.progress}
          metadata={serverState.metadata}
          onClose={() => setRankModalVisible(false)}
        />

        {/* Dev Backend Endpoint Configuration Modal */}
        <DevBackendConfigModal
          visible={apiConfigVisible}
          eyebrow="Security & Server Authority"
          title="Backend Endpoint"
          subtitle="All gamification math, EXP rewards, and task mutations execute on the backend server."
          submitLabel="Connect"
          onClose={() => setApiConfigVisible(false)}
          onSaved={syncWithBackend}
        />
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
  activeCategoryPill: {
    backgroundColor: "#FF1493",
    borderWidth: 1,
    borderColor: "#FF69B4",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  inactiveCategoryPill: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  activeCountBadge: {
    backgroundColor: "#000000",
  },
  inactiveCountBadge: {
    backgroundColor: "#2E1122",
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
