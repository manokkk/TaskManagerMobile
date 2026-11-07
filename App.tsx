import "./global.css";
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StatusBar,
  Modal,
  Alert,
} from "react-native";
import { taskApi } from "./src/services/api";
import { Task, CreateTaskInput, TaskStatus } from "./src/types/task";
import { TaskCard } from "./src/components/TaskCard";
import { TaskFilter } from "./src/components/TaskFilter";
import { CreateTaskModal } from "./src/components/CreateTaskModal";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [apiConfigVisible, setApiConfigVisible] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(taskApi.getBaseUrl());
  const [backendStatus, setBackendStatus] = useState<{
    online: boolean;
    message: string;
  }>({
    online: false,
    message: "Checking server...",
  });

  const checkConnectionAndLoad = async () => {
    setLoading(true);
    const health = await taskApi.checkHealth();
    setBackendStatus(health);
    const data = await taskApi.getTasks();
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    checkConnectionAndLoad();
  }, []);

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        selectedStatus === "all" || task.status === selectedStatus;
      const matchesSearch =
        searchQuery.trim() === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description &&
          task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [tasks, selectedStatus, searchQuery]);

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus =
      task.status === "completed"
        ? "pending"
        : task.status === "pending"
        ? "in_progress"
        : "completed";

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await taskApi.updateTask(task.id, { status: nextStatus });
    } catch {
      // Revert if error
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
    }
  };

  const handleDeleteTask = async (id: number) => {
    // Optimistic delete
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await taskApi.deleteTask(id);
    } catch {
      checkConnectionAndLoad();
    }
  };

  const handleCreateTask = async (input: CreateTaskInput) => {
    try {
      const newTask = await taskApi.createTask(input);
      setTasks((prev) => [newTask, ...prev]);
    } catch {
      Alert.alert("Error", "Could not save task.");
    }
  };

  const handleSaveApiUrl = () => {
    taskApi.setBaseUrl(apiUrlInput);
    setApiConfigVisible(false);
    checkConnectionAndLoad();
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-black text-slate-900 tracking-tight">
              Task Flow
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5 font-medium">
              {counts.completed} of {counts.all} completed
            </Text>
          </View>

          {/* Backend Status indicator */}
          <TouchableOpacity
            onPress={() => setApiConfigVisible(true)}
            className={`flex-row items-center px-3 py-1.5 rounded-full border ${
              backendStatus.online
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <View
              className={`w-2 h-2 rounded-full mr-1.5 ${
                backendStatus.online ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <Text
              className={`text-[10px] font-bold ${
                backendStatus.online ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {backendStatus.online ? "Backend Online" : "Preview Mode"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search input */}
        <View className="mt-3 bg-white rounded-xl px-3 py-2 border border-slate-200 flex-row items-center">
          <Text className="text-slate-400 mr-2 text-sm">🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tasks..."
            placeholderTextColor="#94a3b8"
            className="flex-1 text-xs text-slate-800 p-0"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text className="text-slate-400 font-bold text-xs">✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Status Filter Tabs */}
      <TaskFilter
        currentStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        counts={counts}
      />

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteTask}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={checkConnectionAndLoad}
            colors={["#4f46e5"]}
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-16 px-6">
            <Text className="text-3xl mb-2">📋</Text>
            <Text className="text-base font-bold text-slate-700">
              No tasks found
            </Text>
            <Text className="text-xs text-slate-400 text-center mt-1">
              {searchQuery
                ? `No tasks matching "${searchQuery}"`
                : "Tap the + button below to create your first task!"}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button (+) */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="w-14 h-14 rounded-full bg-indigo-600 items-center justify-center shadow-lg shadow-indigo-500/30 border border-indigo-500"
          activeOpacity={0.85}
        >
          <Text className="text-white text-3xl font-light leading-none mb-1">
            +
          </Text>
        </TouchableOpacity>
      </View>

      {/* Create Task Modal */}
      <CreateTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreateTask}
      />

      {/* API Configuration Modal */}
      <Modal
        visible={apiConfigVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setApiConfigVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40 px-6">
          <View className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl border border-slate-100">
            <Text className="text-base font-bold text-slate-900 mb-1">
              Backend API Configuration
            </Text>
            <Text className="text-xs text-slate-500 mb-3">
              Configure the Express server address. If running on physical mobile
              devices via Expo Go, enter your machine's local network IP.
            </Text>

            <Text className="text-[11px] font-semibold text-slate-600 mb-1">
              Base API URL
            </Text>
            <TextInput
              value={apiUrlInput}
              onChangeText={setApiUrlInput}
              placeholder="e.g. http://192.168.1.50:5000/api"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 mb-4"
            />

            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => setApiConfigVisible(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 items-center mr-2"
              >
                <Text className="text-xs font-semibold text-slate-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveApiUrl}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 items-center"
              >
                <Text className="text-xs font-bold text-white">Save & Reconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

