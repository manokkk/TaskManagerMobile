import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { CreateTaskInput, TaskPriority, TaskStatus } from "../types/task";

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("pending");

  const handleSubmit = () => {
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
    });

    setTitle("");
    setDescription("");
    setPriority("medium");
    setStatus("pending");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/40"
      >
        <View className="bg-white rounded-t-3xl p-6 shadow-xl border-t border-slate-100 max-h-[85%]">
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-slate-900">New Task</Text>
              <TouchableOpacity onPress={onClose} className="p-1">
                <Text className="text-slate-400 font-bold text-base">✕</Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text className="text-xs font-semibold text-slate-600 mb-1">
              Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Finish client dashboard"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm mb-3.5 focus:border-indigo-500"
            />

            {/* Description */}
            <Text className="text-xs font-semibold text-slate-600 mb-1">
              Description (Optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add key notes, links, or subtasks..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm mb-3.5 min-h-[70px] focus:border-indigo-500"
            />

            {/* Priority Selector */}
            <Text className="text-xs font-semibold text-slate-600 mb-1.5">
              Priority
            </Text>
            <View className="flex-row mb-3.5">
              {(["low", "medium", "high"] as TaskPriority[]).map((p) => {
                const isSelected = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPriority(p)}
                    className={`flex-1 py-2 mx-1 rounded-xl items-center border ${
                      isSelected
                        ? p === "high"
                          ? "bg-rose-500 border-rose-500"
                          : p === "medium"
                          ? "bg-amber-500 border-amber-500"
                          : "bg-emerald-500 border-emerald-500"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold capitalize ${
                        isSelected ? "text-white" : "text-slate-600"
                      }`}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Status Selector */}
            <Text className="text-xs font-semibold text-slate-600 mb-1.5">
              Initial Status
            </Text>
            <View className="flex-row mb-6">
              {(["pending", "in_progress", "completed"] as TaskStatus[]).map((s) => {
                const isSelected = status === s;
                const label = s.replace("_", " ");
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStatus(s)}
                    className={`flex-1 py-2 mx-1 rounded-xl items-center border ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold capitalize ${
                        isSelected ? "text-white" : "text-slate-600"
                      }`}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action buttons */}
            <View className="flex-row items-center space-x-3 mb-2">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 py-3 rounded-xl bg-slate-100 items-center mr-2"
              >
                <Text className="text-slate-700 font-semibold text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!title.trim()}
                className={`flex-1 py-3 rounded-xl items-center ${
                  title.trim() ? "bg-indigo-600" : "bg-indigo-300"
                }`}
              >
                <Text className="text-white font-bold text-sm">Create Task</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

