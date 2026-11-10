import { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Task, TaskCategory, TaskInput } from "../types/task";

interface CreateTaskModalProps {
  visible: boolean;
  editingTask?: Task | null;
  expRewards: Record<TaskCategory, number>;
  onClose: () => void;
  onSubmit: (input: TaskInput, existingTaskId?: string) => void;
}

function padTwo(num: number): string {
  return String(num).padStart(2, "0");
}

function toDateInputString(date: Date): string {
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(
    date.getDate()
  )}`;
}

function toTimeInputString(date: Date): string {
  return `${padTwo(date.getHours())}:${padTwo(date.getMinutes())}`;
}

export const CreateTaskModal = ({
  visible,
  editingTask,
  expRewards,
  onClose,
  onSubmit,
}: CreateTaskModalProps) => {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("Daily");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setErrorMessage(null);

    if (editingTask) {
      const existingDate = new Date(editingTask.scheduledAt);
      const validDate = isNaN(existingDate.getTime())
        ? new Date(Date.now() + 3600000)
        : existingDate;
      setTitle(editingTask.title);
      setDescription(editingTask.description || "");
      setCategory(editingTask.category);
      setDateStr(toDateInputString(validDate));
      setTimeStr(toTimeInputString(validDate));
    } else {
      const defaultFuture = new Date(Date.now() + 60 * 60 * 1000);
      setTitle("");
      setDescription("");
      setCategory("Daily");
      setDateStr(toDateInputString(defaultFuture));
      setTimeStr(toTimeInputString(defaultFuture));
    }
  }, [visible, editingTask]);

  const applyQuickScheduleOffset = (minutesFromNow: number) => {
    const target = new Date(Date.now() + minutesFromNow * 60 * 1000);
    setDateStr(toDateInputString(target));
    setTimeStr(toTimeInputString(target));
    setErrorMessage(null);
  };

  const handleSave = () => {
    if (!title.trim()) {
      setErrorMessage("Mission title is required.");
      return;
    }

    const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
    const timeParts = /^(\d{2}):(\d{2})$/.exec(timeStr.trim());

    if (!dateParts || !timeParts) {
      setErrorMessage("Enter Date as YYYY-MM-DD and Time as HH:MM (24h).");
      return;
    }

    const year = Number(dateParts[1]);
    const month = Number(dateParts[2]) - 1;
    const day = Number(dateParts[3]);
    const hours = Number(timeParts[1]);
    const minutes = Number(timeParts[2]);

    if (
      month < 0 ||
      month > 11 ||
      day < 1 ||
      day > 31 ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      setErrorMessage("Invalid calendar date or 24-hour time values.");
      return;
    }

    const constructedDate = new Date(year, month, day, hours, minutes, 0, 0);
    if (isNaN(constructedDate.getTime())) {
      setErrorMessage("Could not parse the target schedule.");
      return;
    }

    onSubmit(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        scheduledAt: constructedDate.toISOString(),
      },
      editingTask?.id
    );

    onClose();
  };

  const categories: TaskCategory[] = ["Daily", "Weekly", "Monthly"];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/85"
      >
        <View
          style={[
            styles.modalSheet,
            { paddingBottom: Math.max(20, insets.bottom + 16) },
          ]}
          className="rounded-t-3xl p-6 max-h-[90%]"
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-widest text-[#FF69B4]">
                  {editingTask ? "Update Mission Parameters" : "Deploy New Mission"}
                </Text>
                <Text className="text-xl font-black text-white mt-0.5">
                  {editingTask ? "Edit Galaxy Task" : "New Galaxy Task"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-[#140710] border border-[#FF1493] items-center justify-center"
              >
                <Text className="text-[#FF1493] font-bold text-sm">✕</Text>
              </TouchableOpacity>
            </View>

            {/* Category Selector with Backend EXP Bounties */}
            <Text className="text-xs font-bold uppercase tracking-wider text-[#FFB6C1] mb-2">
              Mission Frequency & Server EXP Bounty
            </Text>
            <View className="flex-row mb-4">
              {categories.map((cat) => {
                const isSelected = category === cat;
                const reward = expRewards[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={
                      isSelected ? styles.categoryActive : styles.categoryInactive
                    }
                    className="flex-1 py-2.5 mx-1 rounded-2xl items-center"
                  >
                    <Text
                      className={`text-xs font-black uppercase ${
                        isSelected ? "text-black" : "text-white"
                      }`}
                    >
                      {cat}
                    </Text>
                    <Text
                      className={`text-[10px] font-bold mt-0.5 ${
                        isSelected ? "text-black/80" : "text-[#FF69B4]"
                      }`}
                    >
                      +{reward} EXP
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Title Input */}
            <Text className="text-xs font-bold uppercase tracking-wider text-[#FFB6C1] mb-1.5">
              Mission Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={(val: string) => {
                setTitle(val);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. Ship Notification Engine"
              placeholderTextColor="#8A3B68"
              style={styles.inputField}
              className="rounded-xl px-4 py-3 text-white text-sm mb-3.5"
            />

            {/* Description Input */}
            <Text className="text-xs font-bold uppercase tracking-wider text-[#FFB6C1] mb-1.5">
              Briefing Notes (Optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add coordinates, checklists, or mission context..."
              placeholderTextColor="#8A3B68"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={styles.inputField}
              className="rounded-xl px-4 py-3 text-white text-sm mb-4 min-h-[72px]"
            />

            {/* Target Date & Time for Local Push Notification */}
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-xs font-bold uppercase tracking-wider text-[#FFB6C1]">
                🔔 Push Alert Schedule
              </Text>
              <Text className="text-[10px] text-[#FF69B4] font-semibold">
                Local Timezone
              </Text>
            </View>

            {/* Quick Presets */}
            <View className="flex-row mb-2.5">
              {[
                { label: "+15m", mins: 15 },
                { label: "+1h", mins: 60 },
                { label: "+3h", mins: 180 },
                { label: "+24h", mins: 1440 },
              ].map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  onPress={() => applyQuickScheduleOffset(preset.mins)}
                  className="mr-2 px-3 py-1 rounded-full bg-[#140710] border border-[#2E1122]"
                >
                  <Text className="text-[10px] font-bold text-[#FF69B4]">
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-[10px] text-[#FFB6C1]/70 mb-1">
                  Target Date (YYYY-MM-DD)
                </Text>
                <TextInput
                  value={dateStr}
                  onChangeText={setDateStr}
                  placeholder="2026-11-08"
                  placeholderTextColor="#8A3B68"
                  style={styles.inputField}
                  className="rounded-xl px-3.5 py-2.5 text-white text-xs font-mono"
                />
              </View>
              <View className="w-32">
                <Text className="text-[10px] text-[#FFB6C1]/70 mb-1">
                  Time (HH:MM 24h)
                </Text>
                <TextInput
                  value={timeStr}
                  onChangeText={setTimeStr}
                  placeholder="18:30"
                  placeholderTextColor="#8A3B68"
                  style={styles.inputField}
                  className="rounded-xl px-3.5 py-2.5 text-white text-xs font-mono"
                />
              </View>
            </View>

            {errorMessage ? (
              <View className="mb-3 px-3 py-2 rounded-xl bg-[#1F0712] border border-[#FF1493]">
                <Text className="text-xs font-semibold text-[#FF69B4]">
                  ⚠️ {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Submit & Cancel Buttons */}
            <View className="flex-row items-center mt-2 mb-2">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 py-3.5 rounded-2xl bg-[#140710] border border-[#2E1122] items-center mr-2"
              >
                <Text className="text-[#FFB6C1] font-bold text-xs uppercase tracking-wider">
                  Abort
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                style={styles.primaryButton}
                className="flex-1 py-3.5 rounded-2xl items-center"
              >
                <Text className="text-black font-black text-xs uppercase tracking-wider">
                  {editingTask ? "Save Changes" : "Launch Mission"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalSheet: {
    backgroundColor: "#0B0B0B",
    borderTopWidth: 2,
    borderColor: "#FF1493",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 16,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  inputField: {
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  categoryActive: {
    backgroundColor: "#FF1493",
    borderWidth: 1,
    borderColor: "#FF69B4",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  categoryInactive: {
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  primaryButton: {
    backgroundColor: "#FF1493",
    borderWidth: 1,
    borderColor: "#FF69B4",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 6,
  },
});
