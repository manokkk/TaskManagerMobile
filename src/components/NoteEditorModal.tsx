import { ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Svg, { Path } from "react-native-svg";
import { Task } from "../types/task";
import {
  NoteBlock,
  NoteChecklistItem,
  NoteDrawingBlock,
  NoteDrawingStroke,
  NoteFontSize,
  NoteListType,
  NoteMindMapBlock,
  NoteMindMapNode,
  NoteTextAlign,
  NoteTextBlock,
  NoteTextStyle,
  RichNoteDocument,
} from "../types/note";
import {
  createBlockId,
  createEmptyTextBlock,
  getNoteCharacterCount,
  parseNoteDocument,
  serializeNoteDocument,
} from "../utils/noteDocument";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { GalaxyIcon } from "./GalaxyIcon";
import { DrawingCanvasModal } from "./DrawingCanvasModal";
import { MindMapDiagram, MindMapModal } from "./MindMapModal";
import { AiAssistantModal, VoiceDictationModal } from "./NoteToolsModals";

interface NoteEditorModalProps {
  visible: boolean;
  note: Task | null;
  onClose: () => void;
  onSave: (
    noteId: string,
    updates: { title: string; description: string }
  ) => Promise<void>;
  onDelete: (id: string) => void;
}

interface EditorSnapshot {
  title: string;
  blocks: NoteBlock[];
}

const TEXT_COLORS = [
  "#FFFFFF",
  "#FFB6C1",
  "#FF1493",
  "#38BDF8",
  "#10B981",
  "#FACC15",
];

const FONT_SIZE_MAP: Record<NoteFontSize, { fontSize: number; lineHeight: number }> = {
  small: { fontSize: 13, lineHeight: 20 },
  normal: { fontSize: 15, lineHeight: 23 },
  large: { fontSize: 18, lineHeight: 26 },
  title: { fontSize: 21, lineHeight: 29 },
};

function formatNoteTimestamp(isoString?: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const datePart = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} ${timePart}`;
}

function cloneBlocks(blocks: NoteBlock[]): NoteBlock[] {
  return JSON.parse(JSON.stringify(blocks));
}

function applyListPrefix(content: string, listType: NoteListType): string {
  const lines = content.split("\n");
  return lines
    .map((line, index) => {
      const stripped = line.replace(/^(•\s+|\d+\.\s+)/, "");
      if (listType === "bullet") {
        return stripped ? `• ${stripped}` : "• ";
      }
      if (listType === "numbered") {
        return stripped ? `${index + 1}. ${stripped}` : `${index + 1}. `;
      }
      return stripped;
    })
    .join("\n");
}

export const NoteEditorModal = ({
  visible,
  note,
  onClose,
  onSave,
  onDelete,
}: NoteEditorModalProps) => {
  const {
    totalTopPadding,
    horizontalMargin,
    bottomInset,
    isTablet,
    maxContentWidth,
  } = useResponsiveLayout();

  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<NoteBlock[]>([createEmptyTextBlock("")]);
  const [activeTextBlockId, setActiveTextBlockId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Undo / Redo stacks
  const pastRef = useRef<EditorSnapshot[]>([]);
  const futureRef = useRef<EditorSnapshot[]>([]);
  const lastTypingSnapshotAtRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Tool Modals / Formatting Bar
  const [showFormatBar, setShowFormatBar] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [drawingModalVisible, setDrawingModalVisible] = useState(false);
  const [editingDrawingBlock, setEditingDrawingBlock] =
    useState<NoteDrawingBlock | null>(null);
  const [mindMapModalVisible, setMindMapModalVisible] = useState(false);
  const [editingMindMapBlock, setEditingMindMapBlock] =
    useState<NoteMindMapBlock | null>(null);

  const initializedNoteIdRef = useRef<string | null>(null);
  const lastSavedRef = useRef<{ title: string; serialized: string }>({
    title: "",
    serialized: "",
  });
  const isSavingRef = useRef(false);
  const isMountedRef = useRef(true);
  const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const pushSnapshot = useCallback(
    (snapshot: EditorSnapshot, immediate = true) => {
      const now = Date.now();
      if (!immediate && now - lastTypingSnapshotAtRef.current < 650) {
        return;
      }
      lastTypingSnapshotAtRef.current = now;
      pastRef.current = [
        ...pastRef.current.slice(-39),
        { title: snapshot.title, blocks: cloneBlocks(snapshot.blocks) },
      ];
      futureRef.current = [];
      syncHistoryFlags();
    },
    [syncHistoryFlags]
  );

  // Initialize editor state when opening or switching notes
  useEffect(() => {
    if (!visible || !note) {
      initializedNoteIdRef.current = null;
      return;
    }

    if (initializedNoteIdRef.current !== note.id) {
      const initialTitle = note.title || "";
      const parsed = parseNoteDocument(note.description);
      setTitle(initialTitle);
      setBlocks(parsed.blocks);
      const firstText = parsed.blocks.find((b) => b.type === "text");
      setActiveTextBlockId(firstText ? firstText.id : null);
      setSaveState("idle");
      setErrorMessage(null);
      setShowFormatBar(false);

      pastRef.current = [];
      futureRef.current = [];
      syncHistoryFlags();

      lastSavedRef.current = {
        title: initialTitle.trim(),
        serialized: serializeNoteDocument(parsed),
      };
      initializedNoteIdRef.current = note.id;
    }
  }, [visible, note, syncHistoryFlags]);

  const currentDoc: RichNoteDocument = useMemo(
    () => ({ __galaxyNoteV1: true, blocks }),
    [blocks]
  );

  const serializedBody = useMemo(
    () => serializeNoteDocument(currentDoc),
    [currentDoc]
  );

  const charCount = useMemo(
    () => getNoteCharacterCount(currentDoc),
    [currentDoc]
  );

  const isDirty = useMemo(() => {
    return (
      title.trim() !== lastSavedRef.current.title ||
      serializedBody !== lastSavedRef.current.serialized
    );
  }, [title, serializedBody]);

  const hasMindMap = useMemo(
    () => blocks.some((b) => b.type === "mindmap"),
    [blocks]
  );

  const activeTextBlock: NoteTextBlock | undefined = useMemo(() => {
    const found = blocks.find(
      (b): b is NoteTextBlock => b.type === "text" && b.id === activeTextBlockId
    );
    if (found) return found;
    return blocks.find((b): b is NoteTextBlock => b.type === "text");
  }, [blocks, activeTextBlockId]);

  const performSave = useCallback(
    async (nextTitle: string, nextSerialized: string): Promise<boolean> => {
      if (!note) return false;
      const trimmedTitle = nextTitle.trim();

      if (!trimmedTitle) {
        setErrorMessage("Note title cannot be empty.");
        setSaveState("error");
        return false;
      }

      if (
        trimmedTitle === lastSavedRef.current.title &&
        nextSerialized === lastSavedRef.current.serialized
      ) {
        return true;
      }

      if (isSavingRef.current) {
        return false;
      }

      isSavingRef.current = true;
      if (isMountedRef.current) {
        setSaveState("saving");
        setErrorMessage(null);
      }

      try {
        await onSave(note.id, {
          title: trimmedTitle,
          description: nextSerialized,
        });
        lastSavedRef.current = {
          title: trimmedTitle,
          serialized: nextSerialized,
        };
        if (isMountedRef.current) {
          setSaveState("saved");
          setErrorMessage(null);
        }
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to save note.";
        if (isMountedRef.current) {
          setSaveState("error");
          setErrorMessage(msg);
        }
        return false;
      } finally {
        isSavingRef.current = false;
      }
    },
    [note, onSave]
  );

  // Debounced auto-save
  useEffect(() => {
    if (!visible || !note || !isDirty || !title.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      performSave(title, serializedBody);
    }, 900);

    return () => clearTimeout(timer);
  }, [visible, note, isDirty, title, serializedBody, performSave]);

  const handleUndo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const prev = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [
      ...futureRef.current,
      { title, blocks: cloneBlocks(blocks) },
    ];
    setTitle(prev.title);
    setBlocks(prev.blocks);
    syncHistoryFlags();
  }, [title, blocks, syncHistoryFlags]);

  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    pastRef.current = [
      ...pastRef.current,
      { title, blocks: cloneBlocks(blocks) },
    ];
    setTitle(next.title);
    setBlocks(next.blocks);
    syncHistoryFlags();
  }, [title, blocks, syncHistoryFlags]);

  const handleCloseEditor = useCallback(async () => {
    if (!note || !isDirty) {
      onClose();
      return;
    }

    if (!title.trim()) {
      Alert.alert(
        "Missing Note Title",
        "Notes require a title before saving. Discard your unsaved changes?",
        [
          { text: "Keep Editing", style: "cancel" },
          { text: "Discard & Close", style: "destructive", onPress: onClose },
        ]
      );
      return;
    }

    const ok = await performSave(title, serializedBody);
    if (ok) {
      onClose();
    } else {
      Alert.alert(
        "Could Not Save Note",
        "Failed to sync your note with the server. Discard changes or keep editing?",
        [
          { text: "Keep Editing", style: "cancel" },
          { text: "Discard & Close", style: "destructive", onPress: onClose },
        ]
      );
    }
  }, [note, isDirty, title, serializedBody, performSave, onClose]);

  const handleTapCheckmarkSave = useCallback(async () => {
    const ok = await performSave(title, serializedBody);
    if (ok) {
      setSaveState("saved");
    }
  }, [performSave, title, serializedBody]);

  const handleConfirmDelete = useCallback(() => {
    if (!note) return;
    Alert.alert(
      "Delete Note",
      `Are you sure you want to permanently delete "${note.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            onDelete(note.id);
            onClose();
          },
        },
      ]
    );
  }, [note, onDelete, onClose]);

  // Block mutations
  const updateBlocksWithHistory = useCallback(
    (updater: (prev: NoteBlock[]) => NoteBlock[], immediate = true) => {
      pushSnapshot({ title, blocks }, immediate);
      setBlocks(updater);
    },
    [pushSnapshot, title, blocks]
  );

  const ensureTrailingTextBlock = (list: NoteBlock[]): NoteBlock[] => {
    if (list.length === 0 || list[list.length - 1].type !== "text") {
      return [...list, createEmptyTextBlock("")];
    }
    return list;
  };

  const handleTextChange = (blockId: string, nextContent: string) => {
    pushSnapshot({ title, blocks }, false);
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId && b.type === "text" ? { ...b, content: nextContent } : b
      )
    );
  };

  const handleUpdateTextStyle = (patch: Partial<NoteTextStyle>) => {
    if (!activeTextBlock) {
      const fresh = createEmptyTextBlock("", patch);
      updateBlocksWithHistory((prev) => [...prev, fresh], true);
      setActiveTextBlockId(fresh.id);
      return;
    }

    updateBlocksWithHistory(
      (prev) =>
        prev.map((b) => {
          if (b.id !== activeTextBlock.id || b.type !== "text") return b;
          const nextStyle: NoteTextStyle = { ...(b.style || {}), ...patch };
          const nextContent =
            patch.listType !== undefined
              ? applyListPrefix(b.content, patch.listType)
              : b.content;
          return { ...b, style: nextStyle, content: nextContent };
        }),
      true
    );
  };

  // Checklist handlers
  const handleInsertChecklist = () => {
    const newItem: NoteChecklistItem = {
      id: createBlockId("chk"),
      text: "",
      checked: false,
    };

    const lastBlock = blocks[blocks.length - 1];
    if (lastBlock && lastBlock.type === "checklist") {
      updateBlocksWithHistory(
        (prev) =>
          prev.map((b, idx) =>
            idx === prev.length - 1 && b.type === "checklist"
              ? { ...b, items: [...b.items, newItem] }
              : b
          ),
        true
      );
    } else {
      updateBlocksWithHistory(
        (prev) => {
          // Drop trailing empty text block so checklist sits cleanly, then keep trailing text
          const cleaned = prev.filter(
            (b, i) =>
              !(
                i === prev.length - 1 &&
                b.type === "text" &&
                !b.content.trim()
              )
          );
          return ensureTrailingTextBlock([
            ...cleaned,
            {
              id: createBlockId("list"),
              type: "checklist",
              items: [newItem],
            },
          ]);
        },
        true
      );
    }
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
  };

  const handleToggleChecklistItem = (blockId: string, itemId: string) => {
    updateBlocksWithHistory(
      (prev) =>
        prev.map((b) =>
          b.id === blockId && b.type === "checklist"
            ? {
                ...b,
                items: b.items.map((item) =>
                  item.id === itemId
                    ? { ...item, checked: !item.checked }
                    : item
                ),
              }
            : b
        ),
      true
    );
  };

  const handleChangeChecklistItemText = (
    blockId: string,
    itemId: string,
    text: string
  ) => {
    pushSnapshot({ title, blocks }, false);
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId && b.type === "checklist"
          ? {
              ...b,
              items: b.items.map((item) =>
                item.id === itemId ? { ...item, text } : item
              ),
            }
          : b
      )
    );
  };

  const handleAddChecklistItem = (blockId: string, afterItemId?: string) => {
    const newItem: NoteChecklistItem = {
      id: createBlockId("chk"),
      text: "",
      checked: false,
    };

    updateBlocksWithHistory(
      (prev) =>
        prev.map((b) => {
          if (b.id !== blockId || b.type !== "checklist") return b;
          if (!afterItemId) {
            return { ...b, items: [...b.items, newItem] };
          }
          const idx = b.items.findIndex((i) => i.id === afterItemId);
          const nextItems = [...b.items];
          nextItems.splice(idx + 1, 0, newItem);
          return { ...b, items: nextItems };
        }),
      true
    );
  };

  const handleRemoveChecklistItem = (blockId: string, itemId: string) => {
    updateBlocksWithHistory(
      (prev) =>
        prev
          .map((b) => {
            if (b.id !== blockId || b.type !== "checklist") return b;
            return { ...b, items: b.items.filter((i) => i.id !== itemId) };
          })
          .filter((b) => !(b.type === "checklist" && b.items.length === 0)),
      true
    );
  };

  const handleRemoveBlock = (blockId: string) => {
    updateBlocksWithHistory((prev) => {
      const filtered = prev.filter((b) => b.id !== blockId);
      return filtered.length > 0 ? filtered : [createEmptyTextBlock("")];
    }, true);
  };

  // Image Picker (Gallery or Camera)
  const pickImageFromSource = async (source: "library" | "camera") => {
    try {
      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            "Camera Permission Needed",
            "Please allow camera access to take photos for your notes."
          );
          return;
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            "Gallery Permission Needed",
            "Please allow photo library access to insert images into your notes."
          );
          return;
        }
      }

      const pickerResult =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 0.45,
              base64: true,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 0.45,
              base64: true,
            });

      if (pickerResult.canceled || !pickerResult.assets?.[0]) {
        return;
      }

      const asset = pickerResult.assets[0];
      const mimeType = asset.mimeType || "image/jpeg";
      const uri = asset.base64
        ? `data:${mimeType};base64,${asset.base64}`
        : asset.uri;
      const aspectRatio =
        asset.width && asset.height ? asset.width / asset.height : 1.33;

      updateBlocksWithHistory(
        (prev) =>
          ensureTrailingTextBlock([
            ...prev,
            {
              id: createBlockId("img"),
              type: "image",
              uri,
              aspectRatio,
            },
          ]),
        true
      );
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    } catch {
      Alert.alert("Image Error", "Could not load the selected image.");
    }
  };

  const handlePressImageTool = () => {
    if (Platform.OS === "web") {
      pickImageFromSource("library");
      return;
    }

    Alert.alert("Insert Image", "Choose an image source for your note", [
      { text: "Photo Library", onPress: () => pickImageFromSource("library") },
      { text: "Take Photo", onPress: () => pickImageFromSource("camera") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Drawing handler
  const handleSaveDrawing = (drawing: {
    width: number;
    height: number;
    strokes: NoteDrawingStroke[];
  }) => {
    if (drawing.strokes.length === 0) return;

    if (editingDrawingBlock) {
      updateBlocksWithHistory(
        (prev) =>
          prev.map((b) =>
            b.id === editingDrawingBlock.id && b.type === "drawing"
              ? { ...b, ...drawing }
              : b
          ),
        true
      );
      setEditingDrawingBlock(null);
    } else {
      updateBlocksWithHistory(
        (prev) =>
          ensureTrailingTextBlock([
            ...prev,
            {
              id: createBlockId("drw"),
              type: "drawing",
              ...drawing,
            },
          ]),
        true
      );
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  // Mind Map handler
  const handleSaveMindMap = (mindMap: {
    title: string;
    nodes: NoteMindMapNode[];
  }) => {
    if (editingMindMapBlock) {
      updateBlocksWithHistory(
        (prev) =>
          prev.map((b) =>
            b.id === editingMindMapBlock.id && b.type === "mindmap"
              ? { ...b, ...mindMap }
              : b
          ),
        true
      );
      setEditingMindMapBlock(null);
    } else {
      updateBlocksWithHistory(
        (prev) =>
          ensureTrailingTextBlock([
            ...prev,
            {
              id: createBlockId("map"),
              type: "mindmap",
              ...mindMap,
            },
          ]),
        true
      );
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  // AI & Voice insertion helpers
  const handleInsertTextIntoActiveBlock = (text: string) => {
    updateBlocksWithHistory((prev) => {
      const targetId =
        activeTextBlock?.id ??
        prev.find((b) => b.type === "text")?.id;

      if (!targetId) {
        return ensureTrailingTextBlock([...prev, createEmptyTextBlock(text)]);
      }

      return prev.map((b) => {
        if (b.id !== targetId || b.type !== "text") return b;
        const nextContent = b.content.trim()
          ? `${b.content.trimEnd()}\n\n${text}`
          : text;
        return { ...b, content: nextContent };
      });
    }, true);
  };

  const handleReplaceTextBlocks = (text: string) => {
    updateBlocksWithHistory((prev) => {
      const nonText = prev.filter((b) => b.type !== "text");
      const fresh = createEmptyTextBlock(text);
      setActiveTextBlockId(fresh.id);
      return [fresh, ...nonText];
    }, true);
  };

  const handleInsertAiChecklist = (items: NoteChecklistItem[]) => {
    updateBlocksWithHistory(
      (prev) =>
        ensureTrailingTextBlock([
          ...prev,
          {
            id: createBlockId("list"),
            type: "checklist",
            items,
          },
        ]),
      true
    );
  };

  useEffect(() => {
    if (!visible || Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (
        aiModalVisible ||
        voiceModalVisible ||
        drawingModalVisible ||
        mindMapModalVisible
      ) {
        return false;
      }
      handleCloseEditor();
      return true;
    });
    return () => sub.remove();
  }, [
    visible,
    aiModalVisible,
    voiceModalVisible,
    drawingModalVisible,
    mindMapModalVisible,
    handleCloseEditor,
  ]);

  if (!visible || !note) {
    return null;
  }

  const timestampLabel = formatNoteTimestamp(note.updatedAt || note.createdAt);
  const currentStyle = activeTextBlock?.style || {};

  return (
    <View style={styles.screen}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              width: "100%",
              maxWidth: isTablet ? 720 : maxContentWidth,
              alignSelf: "center",
              paddingTop: totalTopPadding,
              paddingBottom: Math.max(bottomInset, 6),
            }}
          >
            {/* Top Bar matching reference: Back (<-) on left; Undo, Redo, Delete, Save Checkmark on right */}
            <View
              style={{ paddingHorizontal: horizontalMargin }}
              className="flex-row items-center justify-between pb-2.5"
            >
              <TouchableOpacity
                onPress={handleCloseEditor}
                style={styles.topIconBtn}
                className="w-10 h-10 rounded-full items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Back to Notes"
              >
                <GalaxyIcon
                  name="arrow-left"
                  size={20}
                  color="#FFFFFF"
                  strokeWidth={2}
                />
              </TouchableOpacity>

              <View className="flex-row items-center">
                {saveState === "saving" && (
                  <Text className="text-[10px] font-bold text-[#FF69B4] mr-2">
                    Saving...
                  </Text>
                )}
                {saveState === "saved" && !isDirty && (
                  <Text className="text-[10px] font-bold text-[#10B981] mr-2">
                    Saved
                  </Text>
                )}

                <TouchableOpacity
                  onPress={handleUndo}
                  disabled={!canUndo}
                  style={[styles.topIconBtn, !canUndo && { opacity: 0.3 }]}
                  className="w-9 h-9 rounded-full items-center justify-center mr-1.5"
                  accessibilityLabel="Undo"
                >
                  <GalaxyIcon name="undo" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRedo}
                  disabled={!canRedo}
                  style={[styles.topIconBtn, !canRedo && { opacity: 0.3 }]}
                  className="w-9 h-9 rounded-full items-center justify-center mr-1.5"
                  accessibilityLabel="Redo"
                >
                  <GalaxyIcon name="redo" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirmDelete}
                  style={styles.topIconBtn}
                  className="w-9 h-9 rounded-full items-center justify-center mr-1.5"
                  accessibilityLabel="Delete note"
                >
                  <GalaxyIcon name="trash" size={16} color="#FF1493" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleTapCheckmarkSave}
                  style={[
                    styles.saveCheckBtn,
                    isDirty && styles.saveCheckBtnActive,
                  ]}
                  className="w-9 h-9 rounded-full items-center justify-center"
                  accessibilityLabel="Save note"
                >
                  <GalaxyIcon
                    name="check"
                    size={18}
                    color={isDirty ? "#000000" : "#FFFFFF"}
                    strokeWidth={2.4}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Banner */}
            {errorMessage ? (
              <View
                style={{ marginHorizontal: horizontalMargin }}
                className="mb-2 px-3 py-2 rounded-xl bg-[#1F0712] border border-[#FF1493] flex-row items-center"
              >
                <View className="mr-1.5">
                  <GalaxyIcon name="alert" size={13} color="#FF69B4" />
                </View>
                <Text className="text-xs font-semibold text-[#FF69B4] flex-1">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Scrollable Note Sheet */}
            <ScrollView
              ref={scrollViewRef}
              className="flex-1"
              contentContainerStyle={{
                paddingHorizontal: horizontalMargin,
                paddingBottom: 28,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Title Input */}
              <TextInput
                value={title}
                onChangeText={(val: string) => {
                  pushSnapshot({ title, blocks }, false);
                  setTitle(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Title"
                placeholderTextColor="#5C4B55"
                multiline
                maxLength={160}
                selectionColor="#FF1493"
                style={styles.titleInput}
              />

              {/* Timestamp | Character Count Metadata Row (matching screenshot) */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[11px] text-[#8A7582]">
                  {timestampLabel ? `${timestampLabel}  |  ` : ""}
                  {charCount} {charCount === 1 ? "character" : "characters"}
                </Text>

                {!hasMindMap && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditingMindMapBlock(null);
                      setMindMapModalVisible(true);
                    }}
                    style={styles.mindMapPill}
                    className="px-2.5 py-1 rounded-lg flex-row items-center"
                    activeOpacity={0.8}
                  >
                    <GalaxyIcon name="mindmap" size={12} color="#F59E0B" />
                    <Text className="text-[11px] font-semibold text-[#F59E0B] ml-1.5">
                      Create a mind map
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Rich Note Blocks */}
              {blocks.map((block, index) => {
                if (block.type === "text") {
                  const st = block.style || {};
                  const sizeConfig =
                    FONT_SIZE_MAP[st.fontSize || "normal"];
                  return (
                    <View key={block.id} className="mb-2">
                      <TextInput
                        value={block.content}
                        onFocus={() => setActiveTextBlockId(block.id)}
                        onChangeText={(val) => handleTextChange(block.id, val)}
                        placeholder={
                          index === 0 ? "Start typing" : "Continue writing..."
                        }
                        placeholderTextColor="#5C4B55"
                        multiline
                        scrollEnabled={false}
                        textAlignVertical="top"
                        selectionColor="#FF1493"
                        style={[
                          styles.textBlockInput,
                          {
                            fontSize: sizeConfig.fontSize,
                            lineHeight: sizeConfig.lineHeight,
                            fontWeight: st.bold ? "700" : "400",
                            fontStyle: st.italic ? "italic" : "normal",
                            textDecorationLine: st.underline
                              ? "underline"
                              : "none",
                            color: st.color || "#F8E8F2",
                            textAlign: st.align || "left",
                          },
                        ]}
                      />
                    </View>
                  );
                }

                if (block.type === "checklist") {
                  return (
                    <View
                      key={block.id}
                      style={styles.blockCard}
                      className="rounded-2xl p-3 my-2"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center">
                          <GalaxyIcon
                            name="checkbox-square"
                            size={13}
                            color="#FF69B4"
                          />
                          <Text className="text-[10px] font-bold uppercase tracking-wider text-[#FF69B4] ml-1.5">
                            Checklist
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveBlock(block.id)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <GalaxyIcon name="close" size={13} color="#8A3B68" />
                        </TouchableOpacity>
                      </View>

                      {block.items.map((item) => (
                        <View
                          key={item.id}
                          className="flex-row items-center py-1.5"
                        >
                          <TouchableOpacity
                            onPress={() =>
                              handleToggleChecklistItem(block.id, item.id)
                            }
                            style={[
                              styles.chkBox,
                              item.checked
                                ? styles.chkBoxDone
                                : styles.chkBoxPending,
                            ]}
                            className="w-5 h-5 rounded items-center justify-center mr-2.5"
                          >
                            {item.checked && (
                              <GalaxyIcon
                                name="check"
                                size={12}
                                color="#000000"
                                strokeWidth={2.5}
                              />
                            )}
                          </TouchableOpacity>

                          <TextInput
                            value={item.text}
                            onChangeText={(txt) =>
                              handleChangeChecklistItemText(
                                block.id,
                                item.id,
                                txt
                              )
                            }
                            onSubmitEditing={() =>
                              handleAddChecklistItem(block.id, item.id)
                            }
                            returnKeyType="next"
                            placeholder="Checklist item..."
                            placeholderTextColor="#6E2E52"
                            style={[
                              styles.chkInput,
                              item.checked && styles.chkInputDone,
                            ]}
                            className="flex-1 text-sm py-0.5 mr-2"
                          />

                          <TouchableOpacity
                            onPress={() =>
                              handleRemoveChecklistItem(block.id, item.id)
                            }
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <GalaxyIcon name="close" size={12} color="#8A3B68" />
                          </TouchableOpacity>
                        </View>
                      ))}

                      <TouchableOpacity
                        onPress={() => handleAddChecklistItem(block.id)}
                        className="flex-row items-center mt-2 pt-2 border-t border-[#1F0B17]"
                      >
                        <GalaxyIcon name="plus" size={12} color="#FF69B4" />
                        <Text className="text-xs font-bold text-[#FF69B4] ml-1.5">
                          Add item
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }

                if (block.type === "image") {
                  return (
                    <View
                      key={block.id}
                      style={styles.blockCard}
                      className="rounded-2xl p-2.5 my-2"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center">
                          <GalaxyIcon name="image" size={13} color="#FF69B4" />
                          <Text className="text-[10px] font-bold uppercase tracking-wider text-[#FF69B4] ml-1.5">
                            Image
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveBlock(block.id)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <GalaxyIcon name="close" size={14} color="#FF1493" />
                        </TouchableOpacity>
                      </View>
                      <Image
                        source={{ uri: block.uri }}
                        style={{
                          width: "100%",
                          aspectRatio: block.aspectRatio || 1.33,
                          maxHeight: 280,
                          borderRadius: 12,
                          backgroundColor: "#050505",
                        }}
                        resizeMode="contain"
                      />
                    </View>
                  );
                }

                if (block.type === "drawing") {
                  return (
                    <View
                      key={block.id}
                      style={styles.blockCard}
                      className="rounded-2xl p-2.5 my-2"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center">
                          <GalaxyIcon name="squiggle" size={13} color="#FF69B4" />
                          <Text className="text-[10px] font-bold uppercase tracking-wider text-[#FF69B4] ml-1.5">
                            Sketch • Tap to edit
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveBlock(block.id)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <GalaxyIcon name="close" size={14} color="#FF1493" />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => {
                          setEditingDrawingBlock(block);
                          setDrawingModalVisible(true);
                        }}
                        style={styles.drawingPreviewBox}
                        className="rounded-xl overflow-hidden"
                      >
                        <Svg
                          width="100%"
                          height={180}
                          viewBox={`0 0 ${block.width || 340} ${block.height || 420}`}
                        >
                          {block.strokes.map((stroke, idx) => (
                            <Path
                              key={`prev_${idx}`}
                              d={stroke.path}
                              stroke={stroke.color}
                              strokeWidth={stroke.width}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            />
                          ))}
                        </Svg>
                      </TouchableOpacity>
                    </View>
                  );
                }

                if (block.type === "mindmap") {
                  return (
                    <View
                      key={block.id}
                      style={styles.blockCard}
                      className="rounded-2xl p-3 my-2"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <TouchableOpacity
                          onPress={() => {
                            setEditingMindMapBlock(block);
                            setMindMapModalVisible(true);
                          }}
                          className="flex-row items-center flex-1"
                        >
                          <GalaxyIcon name="mindmap" size={13} color="#F59E0B" />
                          <Text className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B] ml-1.5">
                            Mind Map • Tap to edit
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRemoveBlock(block.id)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <GalaxyIcon name="close" size={14} color="#FF1493" />
                        </TouchableOpacity>
                      </View>

                      <MindMapDiagram
                        nodes={block.nodes}
                        onSelectNode={() => {
                          setEditingMindMapBlock(block);
                          setMindMapModalVisible(true);
                        }}
                      />
                    </View>
                  );
                }

                return null;
              })}
            </ScrollView>

            {/* Expandable Text Formatting Bar (toggled by T button) */}
            {showFormatBar && (
              <View
                style={styles.formatBar}
                className="px-3 py-2.5 border-t border-[#2E1122]"
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ alignItems: "center" }}
                >
                  {/* Sizes */}
                  {(["small", "normal", "large", "title"] as NoteFontSize[]).map(
                    (sz) => {
                      const active = (currentStyle.fontSize || "normal") === sz;
                      return (
                        <TouchableOpacity
                          key={sz}
                          onPress={() => handleUpdateTextStyle({ fontSize: sz })}
                          style={active ? styles.fmtBtnActive : styles.fmtBtn}
                          className="px-2.5 py-1 rounded-lg mr-1.5"
                        >
                          <Text
                            className={`text-[11px] font-bold capitalize ${
                              active ? "text-black" : "text-white"
                            }`}
                          >
                            {sz}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}

                  <View style={styles.fmtDivider} className="mx-1.5" />

                  {/* Bold / Italic / Underline */}
                  <TouchableOpacity
                    onPress={() =>
                      handleUpdateTextStyle({ bold: !currentStyle.bold })
                    }
                    style={
                      currentStyle.bold ? styles.fmtBtnActive : styles.fmtBtn
                    }
                    className="w-8 h-7 rounded-lg items-center justify-center mr-1.5"
                  >
                    <Text
                      className={`text-xs font-black ${
                        currentStyle.bold ? "text-black" : "text-white"
                      }`}
                    >
                      B
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      handleUpdateTextStyle({ italic: !currentStyle.italic })
                    }
                    style={
                      currentStyle.italic ? styles.fmtBtnActive : styles.fmtBtn
                    }
                    className="w-8 h-7 rounded-lg items-center justify-center mr-1.5"
                  >
                    <Text
                      className={`text-xs font-bold italic ${
                        currentStyle.italic ? "text-black" : "text-white"
                      }`}
                    >
                      I
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      handleUpdateTextStyle({
                        underline: !currentStyle.underline,
                      })
                    }
                    style={
                      currentStyle.underline
                        ? styles.fmtBtnActive
                        : styles.fmtBtn
                    }
                    className="w-8 h-7 rounded-lg items-center justify-center mr-1.5"
                  >
                    <Text
                      className={`text-xs font-bold underline ${
                        currentStyle.underline ? "text-black" : "text-white"
                      }`}
                    >
                      U
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.fmtDivider} className="mx-1.5" />

                  {/* Lists */}
                  <TouchableOpacity
                    onPress={() =>
                      handleUpdateTextStyle({
                        listType:
                          currentStyle.listType === "bullet"
                            ? "none"
                            : "bullet",
                      })
                    }
                    style={
                      currentStyle.listType === "bullet"
                        ? styles.fmtBtnActive
                        : styles.fmtBtn
                    }
                    className="px-2.5 h-7 rounded-lg items-center justify-center mr-1.5"
                  >
                    <Text
                      className={`text-xs font-bold ${
                        currentStyle.listType === "bullet"
                          ? "text-black"
                          : "text-white"
                      }`}
                    >
                      • List
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      handleUpdateTextStyle({
                        listType:
                          currentStyle.listType === "numbered"
                            ? "none"
                            : "numbered",
                      })
                    }
                    style={
                      currentStyle.listType === "numbered"
                        ? styles.fmtBtnActive
                        : styles.fmtBtn
                    }
                    className="px-2.5 h-7 rounded-lg items-center justify-center mr-1.5"
                  >
                    <Text
                      className={`text-xs font-bold ${
                        currentStyle.listType === "numbered"
                          ? "text-black"
                          : "text-white"
                      }`}
                    >
                      1. List
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.fmtDivider} className="mx-1.5" />

                  {/* Alignment */}
                  {(["left", "center", "right"] as NoteTextAlign[]).map(
                    (al) => {
                      const active = (currentStyle.align || "left") === al;
                      return (
                        <TouchableOpacity
                          key={al}
                          onPress={() => handleUpdateTextStyle({ align: al })}
                          style={active ? styles.fmtBtnActive : styles.fmtBtn}
                          className="px-2 h-7 rounded-lg items-center justify-center mr-1.5"
                        >
                          <Text
                            className={`text-[10px] font-bold uppercase ${
                              active ? "text-black" : "text-white"
                            }`}
                          >
                            {al[0]}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}

                  <View style={styles.fmtDivider} className="mx-1.5" />

                  {/* Text Colors */}
                  {TEXT_COLORS.map((color) => {
                    const active = (currentStyle.color || "#FFFFFF") === color;
                    return (
                      <TouchableOpacity
                        key={color}
                        onPress={() => handleUpdateTextStyle({ color })}
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: color },
                          active && styles.colorSwatchActive,
                        ]}
                        className="mr-1.5"
                      />
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Bottom 6-Icon Toolbar matching reference screenshot */}
            <View style={styles.bottomToolbar} className="flex-row items-center justify-around py-2.5 px-2">
              {/* 1. AI Writing Assistant */}
              <TouchableOpacity
                onPress={() => setAiModalVisible(true)}
                style={styles.toolbarBtn}
                className="items-center justify-center px-3 py-1.5 rounded-xl"
                accessibilityLabel="AI Writing Assistant"
              >
                <GalaxyIcon name="ai-pen" size={20} color="#FFB6C1" />
              </TouchableOpacity>

              {/* 2. Speech-to-Text Dictation */}
              <TouchableOpacity
                onPress={() => setVoiceModalVisible(true)}
                style={styles.toolbarBtn}
                className="items-center justify-center px-3 py-1.5 rounded-xl"
                accessibilityLabel="Speech to text dictation"
              >
                <GalaxyIcon name="waveform" size={20} color="#E5E5E5" />
              </TouchableOpacity>

              {/* 3. Insert Image */}
              <TouchableOpacity
                onPress={handlePressImageTool}
                style={styles.toolbarBtn}
                className="items-center justify-center px-3 py-1.5 rounded-xl"
                accessibilityLabel="Insert image"
              >
                <GalaxyIcon name="image" size={20} color="#E5E5E5" />
              </TouchableOpacity>

              {/* 4. Freehand Drawing */}
              <TouchableOpacity
                onPress={() => {
                  setEditingDrawingBlock(null);
                  setDrawingModalVisible(true);
                }}
                style={styles.toolbarBtn}
                className="items-center justify-center px-3 py-1.5 rounded-xl"
                accessibilityLabel="Freehand drawing"
              >
                <GalaxyIcon name="squiggle" size={20} color="#E5E5E5" />
              </TouchableOpacity>

              {/* 5. Checklist inside note */}
              <TouchableOpacity
                onPress={handleInsertChecklist}
                style={styles.toolbarBtn}
                className="items-center justify-center px-3 py-1.5 rounded-xl"
                accessibilityLabel="Add checklist"
              >
                <GalaxyIcon name="checkbox-square" size={20} color="#E5E5E5" />
              </TouchableOpacity>

              {/* 6. Text Formatting (T) */}
              <TouchableOpacity
                onPress={() => setShowFormatBar((prev) => !prev)}
                style={[
                  styles.toolbarBtn,
                  showFormatBar && styles.toolbarBtnActive,
                ]}
                className="items-center justify-center px-3 py-1.5 rounded-xl"
                accessibilityLabel="Text formatting"
              >
                <GalaxyIcon
                  name="text-format"
                  size={20}
                  color={showFormatBar ? "#FF1493" : "#E5E5E5"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

      {/* Sub-Tool Modals */}
      <AiAssistantModal
        visible={aiModalVisible}
        noteTitle={title}
        document={currentDoc}
        onClose={() => setAiModalVisible(false)}
        onInsertText={handleInsertTextIntoActiveBlock}
        onReplaceText={handleReplaceTextBlocks}
        onInsertChecklist={handleInsertAiChecklist}
      />

      <VoiceDictationModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onInsertTranscript={handleInsertTextIntoActiveBlock}
      />

      <DrawingCanvasModal
        visible={drawingModalVisible}
        initialDrawing={editingDrawingBlock}
        onClose={() => {
          setDrawingModalVisible(false);
          setEditingDrawingBlock(null);
        }}
        onSave={handleSaveDrawing}
      />

      <MindMapModal
        visible={mindMapModalVisible}
        defaultTitle={title}
        initialMindMap={editingMindMapBlock}
        onClose={() => {
          setMindMapModalVisible(false);
          setEditingMindMapBlock(null);
        }}
        onSave={handleSaveMindMap}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: "#050505",
  },
  topIconBtn: {
    backgroundColor: "transparent",
  },
  saveCheckBtn: {
    backgroundColor: "transparent",
  },
  saveCheckBtnActive: {
    backgroundColor: "#FF1493",
  },
  titleInput: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
    padding: 0,
    marginBottom: 6,
  },
  mindMapPill: {
    backgroundColor: "#24180B",
    borderWidth: 1,
    borderColor: "#4A3114",
  },
  textBlockInput: {
    padding: 0,
    minHeight: 40,
  },
  blockCard: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  chkBox: {
    borderWidth: 1.5,
  },
  chkBoxPending: {
    borderColor: "#FF69B4",
    backgroundColor: "transparent",
  },
  chkBoxDone: {
    borderColor: "#FF1493",
    backgroundColor: "#FF1493",
  },
  chkInput: {
    color: "#F8E8F2",
    padding: 0,
  },
  chkInputDone: {
    color: "#8A3B68",
    textDecorationLine: "line-through",
  },
  drawingPreviewBox: {
    backgroundColor: "#070508",
    borderWidth: 1,
    borderColor: "#1F0B17",
  },
  formatBar: {
    backgroundColor: "#0B0B0B",
  },
  fmtBtn: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  fmtBtnActive: {
    backgroundColor: "#FF1493",
    borderWidth: 1,
    borderColor: "#FF69B4",
  },
  fmtDivider: {
    width: 1,
    height: 18,
    backgroundColor: "#2E1122",
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  colorSwatchActive: {
    borderWidth: 2,
    borderColor: "#FF1493",
    transform: [{ scale: 1.15 }],
  },
  bottomToolbar: {
    backgroundColor: "#0D0A0D",
    borderTopWidth: 1,
    borderTopColor: "#1F0B17",
  },
  toolbarBtn: {
    backgroundColor: "transparent",
  },
  toolbarBtnActive: {
    backgroundColor: "#1E0B16",
    borderWidth: 1,
    borderColor: "#FF1493",
  },
});
