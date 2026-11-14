import { ComponentRef, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RichNoteDocument } from "../types/note";
import {
  AiAssistantAction,
  AiAssistantResult,
  runLocalAiAssistant,
} from "../utils/noteDocument";
import { GalaxyIcon } from "./GalaxyIcon";

interface AiAssistantModalProps {
  visible: boolean;
  noteTitle: string;
  document: RichNoteDocument;
  onClose: () => void;
  onInsertText: (text: string) => void;
  onReplaceText: (text: string) => void;
  onInsertChecklist: (items: { id: string; text: string; checked: boolean }[]) => void;
}

const AI_ACTIONS: { key: AiAssistantAction; label: string; desc: string }[] = [
  {
    key: "summarize",
    label: "Summarize",
    desc: "Condense into key bullet points",
  },
  {
    key: "polish",
    label: "Polish",
    desc: "Clean grammar & punctuation",
  },
  {
    key: "expand",
    label: "Expand",
    desc: "Turn into a structured outline",
  },
  {
    key: "checklist",
    label: "To Checklist",
    desc: "Extract lines as checkable items",
  },
];

export const AiAssistantModal = ({
  visible,
  noteTitle,
  document,
  onClose,
  onInsertText,
  onReplaceText,
  onInsertChecklist,
}: AiAssistantModalProps) => {
  const insets = useSafeAreaInsets();
  const [selectedAction, setSelectedAction] =
    useState<AiAssistantAction>("summarize");
  const [result, setResult] = useState<AiAssistantResult | null>(null);

  useEffect(() => {
    if (!visible) return;
    setSelectedAction("summarize");
    setResult(runLocalAiAssistant("summarize", noteTitle, document));
  }, [visible, noteTitle, document]);

  const handleSelectAction = (action: AiAssistantAction) => {
    setSelectedAction(action);
    setResult(runLocalAiAssistant(action, noteTitle, document));
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/80">
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(20, insets.bottom + 14) },
          ]}
          className="rounded-t-3xl p-5 max-h-[82%]"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View style={styles.badgeIcon} className="w-8 h-8 rounded-xl items-center justify-center mr-2.5">
                <GalaxyIcon name="ai-pen" size={16} color="#38BDF8" />
              </View>
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-widest text-[#38BDF8]">
                  Smart Note Helper
                </Text>
                <Text className="text-lg font-black text-white">
                  AI Writing Assistant
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-[#140710] border border-[#2E1122] items-center justify-center"
            >
              <GalaxyIcon name="close" size={14} color="#FF1493" />
            </TouchableOpacity>
          </View>

          {/* Action Chips */}
          <View className="flex-row flex-wrap mb-3">
            {AI_ACTIONS.map((item) => {
              const active = selectedAction === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => handleSelectAction(item.key)}
                  style={active ? styles.chipActive : styles.chipInactive}
                  className="mr-2 mb-2 px-3 py-2 rounded-2xl"
                >
                  <Text
                    className={`text-xs font-black ${
                      active ? "text-black" : "text-white"
                    }`}
                  >
                    {item.label}
                  </Text>
                  <Text
                    className={`text-[10px] ${
                      active ? "text-black/75" : "text-[#FFB6C1]/70"
                    }`}
                  >
                    {item.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Preview Box */}
          {result && (
            <View style={styles.previewBox} className="rounded-2xl p-3.5 mb-4">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-[#FF69B4] mb-1.5">
                {result.heading} Preview
              </Text>
              <ScrollView style={{ maxHeight: 170 }}>
                <Text className="text-xs text-[#F8E8F2] leading-5">
                  {result.previewText}
                </Text>
              </ScrollView>
            </View>
          )}

          {/* Apply Buttons */}
          {result && (
            <View className="flex-row items-center">
              {result.action === "checklist" && result.checklistItems ? (
                <TouchableOpacity
                  onPress={() => {
                    onInsertChecklist(result.checklistItems!);
                    onClose();
                  }}
                  style={styles.primaryBtn}
                  className="flex-1 py-3.5 rounded-2xl items-center"
                >
                  <Text className="text-xs font-black text-black uppercase tracking-wider">
                    Insert Checklist Into Note
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      onReplaceText(result.previewText);
                      onClose();
                    }}
                    style={styles.secondaryBtn}
                    className="flex-1 py-3.5 rounded-2xl items-center mr-2"
                  >
                    <Text className="text-xs font-bold text-[#FFB6C1] uppercase tracking-wider">
                      Replace Text
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      onInsertText(result.previewText);
                      onClose();
                    }}
                    style={styles.primaryBtn}
                    className="flex-1 py-3.5 rounded-2xl items-center"
                  >
                    <Text className="text-xs font-black text-black uppercase tracking-wider">
                      Insert Below
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

interface VoiceDictationModalProps {
  visible: boolean;
  onClose: () => void;
  onInsertTranscript: (text: string) => void;
}

export const VoiceDictationModal = ({
  visible,
  onClose,
  onInsertTranscript,
}: VoiceDictationModalProps) => {
  const insets = useSafeAreaInsets();
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const recognitionRef = useRef<any>(null);
  const transcriptInputRef = useRef<ComponentRef<typeof TextInput>>(null);

  const webSpeechAvailable =
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    Boolean(
      (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
    );

  useEffect(() => {
    if (!visible) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    setTranscript("");
    setIsListening(false);
    setStatusNote(
      webSpeechAvailable
        ? "Tap the Microphone icon below and speak clearly."
        : "Tap the Microphone icon below to focus dictation, then use your keyboard's mic key to speak."
    );
  }, [visible, webSpeechAvailable]);

  const handlePressMicrophone = () => {
    if (webSpeechAvailable) {
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        setIsListening(false);
        setStatusNote("Dictation paused. Review or edit before inserting.");
        return;
      }

      const SpeechRec =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      const baseText = transcript ? `${transcript.trim()} ` : "";

      rec.onresult = (event: any) => {
        let combined = "";
        for (let i = 0; i < event.results.length; i++) {
          combined += event.results[i][0].transcript;
        }
        setTranscript(`${baseText}${combined}`.trimStart());
      };

      rec.onerror = (event: any) => {
        setIsListening(false);
        setStatusNote(`Mic error: ${event?.error || "unavailable"}`);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
      setStatusNote("Listening... speak now.");
      return;
    }

    const nextListening = !isListening;
    setIsListening(nextListening);
    if (nextListening) {
      transcriptInputRef.current?.focus();
      setStatusNote(
        "Mic ready — tap your keyboard's microphone icon to dictate straight into the box."
      );
    } else {
      setStatusNote("Dictation paused. Edit text or tap Insert Into Note.");
    }
  };

  const handleInsert = () => {
    if (!transcript.trim()) return;
    onInsertTranscript(transcript.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/80"
      >
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(20, insets.bottom + 14) },
          ]}
          className="rounded-t-3xl p-5"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View
                style={styles.badgeIcon}
                className="w-8 h-8 rounded-xl items-center justify-center mr-2.5"
              >
                <GalaxyIcon name="waveform" size={16} color="#FF69B4" />
              </View>
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-widest text-[#FF69B4]">
                  Voice-to-Text
                </Text>
                <Text className="text-lg font-black text-white">
                  Speech Dictation
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-[#140710] border border-[#2E1122] items-center justify-center"
            >
              <GalaxyIcon name="close" size={14} color="#FF1493" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-[#FFB6C1]/80 mb-3">{statusNote}</Text>

          <TextInput
            ref={transcriptInputRef}
            value={transcript}
            onChangeText={setTranscript}
            placeholder="Dictated text will appear here..."
            placeholderTextColor="#8A3B68"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            autoFocus
            style={styles.transcriptInput}
            className="rounded-2xl p-3.5 text-white text-sm mb-4 min-h-[100px]"
          />

          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handlePressMicrophone}
              style={isListening ? styles.listeningBtn : styles.micButton}
              className="w-12 h-12 rounded-full items-center justify-center mr-3"
              accessibilityRole="button"
              accessibilityLabel="Microphone dictation"
            >
              <GalaxyIcon
                name="mic"
                size={22}
                color={isListening ? "#000000" : "#FF1493"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleInsert}
              disabled={!transcript.trim()}
              style={[
                styles.primaryBtn,
                !transcript.trim() && { opacity: 0.45 },
              ]}
              className="flex-1 py-3.5 rounded-2xl items-center"
            >
              <Text className="text-xs font-black text-black uppercase tracking-wider">
                Insert Into Note
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: "#0B0B0B",
    borderTopWidth: 2,
    borderColor: "#FF1493",
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  badgeIcon: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  chipActive: {
    backgroundColor: "#FF1493",
    borderWidth: 1,
    borderColor: "#FF69B4",
  },
  chipInactive: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  previewBox: {
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  transcriptInput: {
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  secondaryBtn: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  listeningBtn: {
    backgroundColor: "#10B981",
    borderWidth: 1.5,
    borderColor: "#34D399",
  },
  micButton: {
    backgroundColor: "#140710",
    borderWidth: 1.5,
    borderColor: "#FF1493",
  },
  primaryBtn: {
    backgroundColor: "#FF1493",
  },
});
