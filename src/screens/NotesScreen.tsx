import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Task } from "../types/task";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";

interface NotesScreenProps {
  notes: Task[];
  loading: boolean;
  onRefresh: () => void;
  onToggleStatus: (id: string) => void;
  onEditNote: (note: Task) => void;
  onDeleteNote: (id: string) => void;
  onAddNewNote: () => void;
}

export const NotesScreen = ({
  notes,
  loading,
  onRefresh,
  onToggleStatus,
  onEditNote,
  onDeleteNote,
  onAddNewNote,
}: NotesScreenProps) => {
  const { totalTopPadding, horizontalMargin, isSmallDevice, isTablet, maxContentWidth, bottomInset } =
    useResponsiveLayout();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      (n.description && n.description.toLowerCase().includes(q))
    );
  });

  const completedCount = notes.filter((n) => n.status === "Done").length;

  return (
    <View style={styles.container}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: isTablet ? 560 : maxContentWidth,
          alignSelf: "center",
          paddingTop: totalTopPadding,
        }}
      >
        {/* Header HUD */}
        <View
          style={[styles.headerCard, { marginHorizontal: horizontalMargin }]}
          className="rounded-3xl p-4 mb-3"
        >
          <View className="flex-row items-center justify-between mb-1">
            <View>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-[#FF69B4]">
                ✦ Memos & Unscheduled Logs
              </Text>
              <Text className="text-2xl font-black text-white mt-0.5">
                Commander Notes
              </Text>
            </View>
            <TouchableOpacity
              onPress={onAddNewNote}
              style={styles.addNoteHeaderBtn}
              className="px-3 py-1.5 rounded-full flex-row items-center"
              activeOpacity={0.8}
            >
              <Text className="text-xs font-black text-black mr-1">+</Text>
              <Text className="text-xs font-black text-black uppercase">Add Note</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between pt-2 border-t border-[#2E1122]">
            <Text className="text-[10px] text-[#FFB6C1]/80">
              Not bound to Daily, Weekly, or Monthly schedules
            </Text>
            <Text className="text-xs font-bold text-[#FF1493]">
              {completedCount}/{notes.length} Completed
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: horizontalMargin, marginBottom: 8 }}>
          <View
            style={[styles.searchBox, { height: isSmallDevice ? 40 : 44 }]}
            className="rounded-2xl px-3.5 flex-row items-center"
          >
            <Text className="text-[#FF1493] mr-2 text-xs">📝</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search through notes & memos..."
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

        {/* Notes List */}
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingBottom: (isSmallDevice ? 90 : 100) + Math.max(bottomInset, 8),
            paddingHorizontal: horizontalMargin,
            paddingTop: 4,
          }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              tintColor="#FF1493"
              colors={["#FF1493"]}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-6">
              <Text className="text-4xl mb-3">📝</Text>
              <Text className="text-base font-extrabold text-white text-center">
                {searchQuery ? `No notes matching "${searchQuery}"` : "No Notes in Sector"}
              </Text>
              <Text className="text-xs text-[#FFB6C1]/70 text-center mt-1.5 mb-5 max-w-xs">
                Notes are quick tasks, checklists, and memos that don't belong to a daily, weekly, or monthly cadence.
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  onPress={onAddNewNote}
                  style={styles.addNoteHeaderBtn}
                  className="px-5 py-2.5 rounded-2xl flex-row items-center"
                >
                  <Text className="text-xs font-black text-black uppercase tracking-wider">
                    + Create First Note
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isDone = item.status === "Done";
            return (
              <View
                style={[styles.noteCard, isDone && styles.noteCardDone]}
                className="rounded-2xl p-4 mb-3"
              >
                <View className="flex-row items-start justify-between">
                  {/* Status Toggle & Title */}
                  <TouchableOpacity
                    onPress={() => onToggleStatus(item.id)}
                    className="flex-row items-start flex-1 mr-2"
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isDone ? styles.checkboxDone : styles.checkboxPending,
                      ]}
                      className="w-5 h-5 rounded-md items-center justify-center mr-2.5 mt-0.5"
                    >
                      {isDone && <Text className="text-black text-[10px] font-black">✓</Text>}
                    </View>

                    <View className="flex-1">
                      <Text
                        className={`text-sm font-bold ${
                          isDone ? "text-[#FFB6C1]/50 line-through" : "text-white"
                        }`}
                      >
                        {item.title}
                      </Text>
                      {item.description ? (
                        <Text
                          className={`text-xs mt-1 ${
                            isDone ? "text-[#FFB6C1]/40 line-through" : "text-[#FFB6C1]/80"
                          }`}
                        >
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>

                  {/* Actions (Edit / Delete) */}
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={() => onEditNote(item)}
                      className="w-7 h-7 rounded-lg bg-[#140710] border border-[#2E1122] items-center justify-center mr-1.5"
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={{ fontSize: 11 }}>✏️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onDeleteNote(item.id)}
                      className="w-7 h-7 rounded-lg bg-[#140710] border border-[#2E1122] items-center justify-center"
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={{ fontSize: 11 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Footer date */}
                <View className="flex-row items-center justify-between mt-2.5 pt-2 border-t border-[#1F0B17]">
                  <Text className="text-[9px] font-mono text-[#8A3B68]">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Text className="text-[9px] font-bold text-[#FF69B4]">
                    {isDone ? "+5 EXP Earned" : "+5 EXP on complete"}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  headerCard: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#FF1493",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  addNoteHeaderBtn: {
    backgroundColor: "#FF1493",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBox: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  noteCard: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  noteCardDone: {
    opacity: 0.65,
    borderColor: "#1F0B17",
  },
  checkbox: {
    borderWidth: 1.5,
  },
  checkboxPending: {
    borderColor: "#FF69B4",
    backgroundColor: "transparent",
  },
  checkboxDone: {
    borderColor: "#FF1493",
    backgroundColor: "#FF1493",
  },
});

