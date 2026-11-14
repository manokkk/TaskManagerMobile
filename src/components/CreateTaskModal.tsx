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

interface CreateTaskModalProps {
  visible: boolean;
  editingTask?: Task | null;
  expRewards: Record<TaskCategory, number>;
  defaultCategory?: TaskCategory;
  noteOnly?: boolean;
  onClose: () => void;
  onSubmit: (input: TaskInput, existingTaskId?: string) => void;
}

function getCategoryScheduledAt(category: TaskCategory): string {
  const target = new Date();
  if (category === "Daily") {
    target.setDate(target.getDate() + 1);
    target.setHours(0, 0, 0, 0);
    return target.toISOString();
  }
  if (category === "Weekly") {
    target.setDate(target.getDate() + 7);
    target.setHours(0, 0, 0, 0);
    return target.toISOString();
  }
  if (category === "Monthly") {
    target.setMonth(target.getMonth() + 1);
    target.setHours(0, 0, 0, 0);
    return target.toISOString();
  }
  return target.toISOString();
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("Daily");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setErrorMessage(null);

    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || "");
      setCategory(editingTask.category);
    } else {
      setTitle("");
      setDescription("");
      setCategory(defaultCategory || "Daily");
    }
  }, [visible, editingTask, defaultCategory]);

  const isNoteMode = category === "Note";

  const handleSave = () => {
    if (!title.trim()) {
      setErrorMessage(isNoteMode ? "Note title is required." : "Title is required.");
      return;
    }

    const scheduledAt =
      editingTask &&
      editingTask.category === category &&
      editingTask.scheduledAt &&
      !isNaN(new Date(editingTask.scheduledAt).getTime())
        ? editingTask.scheduledAt
        : getCategoryScheduledAt(category);

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
          <ScrollView showsVerticalScrollIndicator={false}>
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
              placeholder={
                isNoteMode
                  ? "e.g. Project Ideas, Meeting Notes..."
                  : "e.g. Ship Notification Engine"
              }
              placeholderTextColor="#8A3B68"
              autoFocus={noteOnly && !editingTask}
              style={styles.inputField}
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
                  placeholder="Add coordinates, checklists, or mission context..."
                  placeholderTextColor="#8A3B68"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={styles.inputField}
                  className="rounded-xl px-4 py-3 text-white text-sm mb-4 min-h-[72px]"
                />
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
