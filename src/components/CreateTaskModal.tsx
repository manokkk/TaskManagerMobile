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
import { GalaxyIcon } from "./GalaxyIcon";
import {
  FOCUS_HIGHLIGHT_STYLE,
  useScrollToFocusedInput,
} from "../hooks/useScrollToFocusedInput";

interface CreateTaskModalProps {
  visible: boolean;
  editingTask?: Task | null;
  expRewards: Record<TaskCategory, number>;
  defaultCategory?: TaskCategory;
  noteOnly?: boolean;
  onClose: () => void;
  onSubmit: (input: TaskInput, existingTaskId?: string) => void;
}

function padTwo(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDateInput(date: Date): string {
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(
    date.getDate()
  )}`;
}

function formatTimeInput(date: Date): string {
  return `${padTwo(date.getHours())}:${padTwo(date.getMinutes())}`;
}

function getDefaultScheduleDate(category: TaskCategory): Date {
  const target = new Date();
  if (category === "Daily") {
    target.setDate(target.getDate() + 1);
    target.setHours(9, 0, 0, 0);
    return target;
  }
  if (category === "Weekly") {
    target.setDate(target.getDate() + 7);
    target.setHours(9, 0, 0, 0);
    return target;
  }
  if (category === "Monthly") {
    target.setMonth(target.getMonth() + 1);
    target.setHours(9, 0, 0, 0);
    return target;
  }
  return target;
}

function parseScheduleInputs(dateStr: string, timeStr: string): Date | null {
  const dateMatch = dateStr.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const timeMatch = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hour ||
    parsed.getMinutes() !== minute
  ) {
    return null;
  }

  return parsed;
}

function formatSchedulePreview(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const CreateTaskModal = ({
  visible,
  editingTask,
  expRewards,
  defaultCategory,
  noteOnly = false,
  onClose,
  onSubmit,
}: CreateTaskModalProps) => {
  const insets = useSafeAreaInsets();
  const {
    scrollViewRef,
    focusedKey,
    keyboardHeight,
    onScroll,
    handleFocus,
    handleBlur,
  } = useScrollToFocusedInput({ enabled: visible, extraOffset: 36 });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("Daily");
  const [notifyDate, setNotifyDate] = useState("");
  const [notifyTime, setNotifyTime] = useState("");
  const [hasCustomSchedule, setHasCustomSchedule] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setErrorMessage(null);

    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || "");
      setCategory(editingTask.category);
      const existing = editingTask.scheduledAt
        ? new Date(editingTask.scheduledAt)
        : null;
      const baseDate =
        existing && !isNaN(existing.getTime())
          ? existing
          : getDefaultScheduleDate(editingTask.category);
      setNotifyDate(formatDateInput(baseDate));
      setNotifyTime(formatTimeInput(baseDate));
      setHasCustomSchedule(true);
    } else {
      const initialCategory = defaultCategory || "Daily";
      const defaultDate = getDefaultScheduleDate(initialCategory);
      setTitle("");
      setDescription("");
      setCategory(initialCategory);
      setNotifyDate(formatDateInput(defaultDate));
      setNotifyTime(formatTimeInput(defaultDate));
      setHasCustomSchedule(false);
    }
  }, [visible, editingTask, defaultCategory]);

  const isNoteMode = category === "Note";
  const parsedSchedule = isNoteMode
    ? null
    : parseScheduleInputs(notifyDate, notifyTime);
  const isScheduleInPast = Boolean(
    parsedSchedule && parsedSchedule.getTime() <= Date.now()
  );

  const handleSelectCategory = (nextCategory: TaskCategory) => {
    setCategory(nextCategory);
    if (!editingTask && !hasCustomSchedule && nextCategory !== "Note") {
      const nextDefault = getDefaultScheduleDate(nextCategory);
      setNotifyDate(formatDateInput(nextDefault));
      setNotifyTime(formatTimeInput(nextDefault));
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      setErrorMessage(isNoteMode ? "Note title is required." : "Title is required.");
      return;
    }

    let scheduledAt: string;

    if (isNoteMode) {
      scheduledAt =
        editingTask?.scheduledAt &&
        !isNaN(new Date(editingTask.scheduledAt).getTime())
          ? editingTask.scheduledAt
          : new Date().toISOString();
    } else {
      const parsed = parseScheduleInputs(notifyDate, notifyTime);
      if (!parsed) {
        setErrorMessage(
          "Enter a valid notification date (YYYY-MM-DD) and 24h time (HH:MM)."
        );
        return;
      }

      const originalDate = editingTask?.scheduledAt
        ? new Date(editingTask.scheduledAt)
        : null;
      const scheduleUnchanged = Boolean(
        originalDate &&
          !isNaN(originalDate.getTime()) &&
          formatDateInput(originalDate) === notifyDate.trim() &&
          formatTimeInput(originalDate) === notifyTime.trim()
      );

      if ((!editingTask || !scheduleUnchanged) && parsed.getTime() <= Date.now()) {
        setErrorMessage("Push notification time must be in the future.");
        return;
      }

      scheduledAt =
        scheduleUnchanged && editingTask
          ? editingTask.scheduledAt
          : parsed.toISOString();
    }

    onSubmit(
      {
        title: title.trim(),
        description: isNoteMode
          ? editingTask?.description || undefined
          : description.trim() || undefined,
        category,
        scheduledAt,
      },
      editingTask?.id
    );

    onClose();
  };

  const categories: TaskCategory[] = ["Daily", "Weekly", "Monthly", "Note"];

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
          <ScrollView
            ref={scrollViewRef}
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: keyboardHeight > 0 ? 24 : 4,
            }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-widest text-[#FF69B4]">
                  {isNoteMode
                    ? editingTask
                      ? "Update Note"
                      : "New Notepad Entry"
                    : editingTask
                    ? "Update Mission Parameters"
                    : "Deploy New Mission"}
                </Text>
                <Text className="text-xl font-black text-white mt-0.5">
                  {isNoteMode
                    ? editingTask
                      ? "Edit Note"
                      : "New Note"
                    : editingTask
                    ? "Edit Galaxy Task"
                    : "New Galaxy Task"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-[#140710] border border-[#FF1493] items-center justify-center"
              >
                <GalaxyIcon name="close" size={14} color="#FF1493" />
              </TouchableOpacity>
            </View>

            {/* Category Selector with Backend EXP Bounties */}
            {!(noteOnly && !editingTask) && (
              <>
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
                        onPress={() => handleSelectCategory(cat)}
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
                          {reward > 0 ? `+${reward} EXP` : "No EXP"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Title Input */}
            <Text className="text-xs font-bold uppercase tracking-wider text-[#FFB6C1] mb-1.5">
              {isNoteMode ? "Note Title *" : "Mission Title *"}
            </Text>
            <TextInput
              value={title}
              onChangeText={(val: string) => {
                setTitle(val);
                if (errorMessage) setErrorMessage(null);
              }}
              onFocus={(e) => handleFocus("title", e)}
              onBlur={() => handleBlur("title")}
              placeholder={
                isNoteMode
                  ? "e.g. Project Ideas, Meeting Notes..."
                  : "e.g. Ship Notification Engine"
              }
              placeholderTextColor="#8A3B68"
              autoFocus={noteOnly && !editingTask}
              style={[
                styles.inputField,
                focusedKey === "title" && FOCUS_HIGHLIGHT_STYLE,
              ]}
              className="rounded-xl px-4 py-3 text-white text-sm mb-3.5"
            />

            {/* Description Input (Tasks only; Notes open in the full-screen notepad) */}
            {isNoteMode ? (
              <View
                style={styles.noteHintBox}
                className="rounded-xl px-3.5 py-2.5 mb-4 flex-row items-center"
              >
                <View className="mr-2">
                  <GalaxyIcon name="note" size={14} color="#FF69B4" />
                </View>
                <Text className="text-xs text-[#FFB6C1]/80 flex-1">
                  Tap this note after creating it to open the notepad and write inside.
                </Text>
              </View>
            ) : (
              <>
                <Text className="text-xs font-bold uppercase tracking-wider text-[#FFB6C1] mb-1.5">
                  Briefing Notes (Optional)
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  onFocus={(e) => handleFocus("description", e)}
                  onBlur={() => handleBlur("description")}
                  placeholder="Add coordinates, checklists, or mission context..."
                  placeholderTextColor="#8A3B68"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={[
                    styles.inputField,
                    focusedKey === "description" && FOCUS_HIGHLIGHT_STYLE,
                  ]}
                  className="rounded-xl px-4 py-3 text-white text-sm mb-3.5 min-h-[72px]"
                />

                {/* Push Notification Date & Time Input Box */}
                <View className="flex-row items-center mb-1.5">
                  <View className="mr-1.5">
                    <GalaxyIcon name="bell" size={12} color="#FF69B4" />
                  </View>
                  <Text className="text-xs font-bold uppercase tracking-wider text-[#FFB6C1]">
                    Push Notification Time *
                  </Text>
                </View>
                <View style={styles.scheduleCard} className="rounded-2xl p-3 mb-4">
                  <View className="flex-row">
                    <View className="flex-1 mr-2">
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-[#FF69B4] mb-1">
                        Date (YYYY-MM-DD)
                      </Text>
                      <View
                        style={[
                          styles.inputField,
                          focusedKey === "notifyDate" && FOCUS_HIGHLIGHT_STYLE,
                        ]}
                        className="rounded-xl px-3 py-2 flex-row items-center"
                      >
                        <View className="mr-2">
                          <GalaxyIcon name="calendar" size={13} color="#FF69B4" />
                        </View>
                        <TextInput
                          value={notifyDate}
                          onChangeText={(val: string) => {
                            setNotifyDate(val);
                            setHasCustomSchedule(true);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          onFocus={(e) => handleFocus("notifyDate", e)}
                          onBlur={() => handleBlur("notifyDate")}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="#8A3B68"
                          keyboardType="numbers-and-punctuation"
                          maxLength={10}
                          autoCapitalize="none"
                          autoCorrect={false}
                          className="flex-1 text-white text-sm p-0"
                        />
                      </View>
                    </View>

                    <View className="w-32">
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-[#FF69B4] mb-1">
                        Time (24h HH:MM)
                      </Text>
                      <View
                        style={[
                          styles.inputField,
                          focusedKey === "notifyTime" && FOCUS_HIGHLIGHT_STYLE,
                        ]}
                        className="rounded-xl px-3 py-2 flex-row items-center"
                      >
                        <View className="mr-2">
                          <GalaxyIcon name="clock" size={13} color="#FF69B4" />
                        </View>
                        <TextInput
                          value={notifyTime}
                          onChangeText={(val: string) => {
                            setNotifyTime(val);
                            setHasCustomSchedule(true);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          onFocus={(e) => handleFocus("notifyTime", e)}
                          onBlur={() => handleBlur("notifyTime")}
                          placeholder="09:00"
                          placeholderTextColor="#8A3B68"
                          keyboardType="numbers-and-punctuation"
                          maxLength={5}
                          autoCapitalize="none"
                          autoCorrect={false}
                          className="flex-1 text-white text-sm p-0"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Live Notification Schedule Preview */}
                  <Text
                    className={`text-[11px] mt-2 ${
                      !parsedSchedule || isScheduleInPast
                        ? "text-[#FF69B4]"
                        : "text-[#FFB6C1]/85"
                    }`}
                  >
                    {!parsedSchedule
                      ? "Use YYYY-MM-DD and 24-hour HH:MM format."
                      : isScheduleInPast
                      ? editingTask
                        ? "Past time — update to reschedule push notification."
                        : "Pick a future date & time to trigger push notification."
                      : `Push alert scheduled for ${formatSchedulePreview(parsedSchedule)}`}
                  </Text>
                </View>
              </>
            )}

            {errorMessage ? (
              <View className="mb-3 px-3 py-2 rounded-xl bg-[#1F0712] border border-[#FF1493] flex-row items-center">
                <View className="mr-1.5">
                  <GalaxyIcon name="alert" size={14} color="#FF69B4" />
                </View>
                <Text className="text-xs font-semibold text-[#FF69B4] flex-1">
                  {errorMessage}
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
                  {isNoteMode ? "Cancel" : "Abort"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                style={styles.primaryButton}
                className="flex-1 py-3.5 rounded-2xl items-center"
              >
                <Text className="text-black font-black text-xs uppercase tracking-wider">
                  {editingTask
                    ? "Save Changes"
                    : isNoteMode
                    ? "Create Note"
                    : "Launch Mission"}
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
  scheduleCard: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  noteHintBox: {
    backgroundColor: "#140710",
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
