import { useState } from "react";
import {
  Alert,
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
import { GalaxyIcon } from "../components/GalaxyIcon";
import { getNotePlainText, getNotePreviewSummary } from "../utils/noteDocument";

interface NotesScreenProps {
  notes: Task[];
  loading: boolean;
  onRefresh: () => void;
  onOpenNote: (note: Task) => void;
  onDeleteNote: (id: string) => void;
  onAddNewNote: () => void;
}

function formatNoteDate(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export const NotesScreen = ({
  notes,
  loading,
  onRefresh,
  onOpenNote,
  onDeleteNote,
  onAddNewNote,
}: NotesScreenProps) => {
  const { totalTopPadding, horizontalMargin, isSmallDevice, isTablet, maxContentWidth, bottomInset } =
    useResponsiveLayout();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const bodyText = getNotePlainText(n.description).toLowerCase();
    return n.title.toLowerCase().includes(q) || bodyText.includes(q);
  });

  const handleConfirmDelete = (note: Task) => {
    Alert.alert(
      "Delete Note",
      `Delete "${note.title}" permanently?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDeleteNote(note.id),
        },
      ]
    );
  };

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
              <View className="flex-row items-center">
                <View className="mr-1.5">
                  <GalaxyIcon name="sparkles" size={11} color="#FF69B4" />
                </View>
                <Text className="text-[10px] font-bold uppercase tracking-widest text-[#FF69B4]">
                  Memos & Unscheduled Logs
                </Text>
              </View>
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
              <View className="mr-1">
                <GalaxyIcon name="plus" size={13} color="#000000" strokeWidth={2.5} />
              </View>
              <Text className="text-xs font-black text-black uppercase">Add Note</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between pt-2 border-t border-[#2E1122]">
            <Text className="text-[10px] text-[#FFB6C1]/80">
              Tap any note to open the notepad and write inside
            </Text>
            <Text className="text-xs font-bold text-[#FF1493]">
              {notes.length} {notes.length === 1 ? "Note" : "Notes"}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: horizontalMargin, marginBottom: 8 }}>
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
              placeholder="Search through notes & memos..."
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
              <View className="mb-3">
                <GalaxyIcon name="note" size={38} color="#FF1493" />
              </View>
              <Text className="text-base font-extrabold text-white text-center">
                {searchQuery ? `No notes matching "${searchQuery}"` : "No Notes in Sector"}
              </Text>
              <Text className="text-xs text-[#FFB6C1]/70 text-center mt-1.5 mb-5 max-w-xs">
                Create a note with a title, then tap it anytime to open your notepad and write freely inside.
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  onPress={onAddNewNote}
                  style={styles.addNoteHeaderBtn}
                  className="px-5 py-2.5 rounded-2xl flex-row items-center"
                >
                  <View className="mr-1.5">
                    <GalaxyIcon name="plus" size={14} color="#000000" strokeWidth={2.5} />
                  </View>
                  <Text className="text-xs font-black text-black uppercase tracking-wider">
                    Create First Note
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const preview = getNotePreviewSummary(item.description);
            const dateLabel = formatNoteDate(item.updatedAt || item.createdAt);

            return (
              <TouchableOpacity
                onPress={() => onOpenNote(item)}
                activeOpacity={0.78}
                style={styles.noteCard}
                className="rounded-2xl p-4 mb-3"
                accessibilityRole="button"
                accessibilityLabel={`Open note ${item.title}`}
              >
                <View className="flex-row items-start justify-between">
                  {/* Note Icon Badge (no checkbox — notes are not tasks) */}
                  <View
                    style={styles.noteIconBadge}
                    className="w-8 h-8 rounded-xl items-center justify-center mr-3 mt-0.5"
                  >
                    <GalaxyIcon name="note" size={15} color="#FF1493" />
                  </View>

                  {/* Note Title, Snippet & Rich Content Badges */}
                  <View className="flex-1 mr-2">
                    <Text
                      numberOfLines={2}
                      className="text-sm font-bold text-white"
                    >
                      {item.title}
                    </Text>

                    {preview.snippet ? (
                      <Text
                        numberOfLines={3}
                        className="text-xs mt-1 leading-relaxed text-[#FFB6C1]/80"
                      >
                        {preview.snippet}
                      </Text>
                    ) : preview.badges.length === 0 ? (
                      <Text className="text-xs italic text-[#8A3B68] mt-1">
                        Tap to open notepad and write inside...
                      </Text>
                    ) : null}

                    {preview.badges.length > 0 && (
                      <View className="flex-row flex-wrap mt-2">
                        {preview.badges.map((badge) => (
                          <View
                            key={badge}
                            style={styles.metaChip}
                            className="px-2 py-0.5 rounded-full mr-1.5 mb-1"
                          >
                            <Text className="text-[10px] font-bold text-[#FF69B4]">
                              {badge}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View className="flex-row items-center mt-1.5">
                      {dateLabel ? (
                        <Text className="text-[10px] font-mono text-[#8A3B68]">
                          {dateLabel}
                        </Text>
                      ) : null}
                      {preview.charCount > 0 ? (
                        <Text className="text-[10px] font-mono text-[#FF69B4]/70 ml-2">
                          • {preview.charCount}{" "}
                          {preview.charCount === 1 ? "char" : "chars"}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Delete Action */}
                  <TouchableOpacity
                    onPress={() => handleConfirmDelete(item)}
                    className="w-8 h-8 rounded-lg bg-[#140710] border border-[#2E1122] items-center justify-center"
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    accessibilityLabel="Delete note"
                  >
                    <GalaxyIcon name="trash" size={14} color="#FF1493" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
  noteIconBadge: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  metaChip: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
});

