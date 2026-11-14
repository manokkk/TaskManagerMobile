import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { galaxyApi } from "../services/api";
import { GalaxyIcon } from "./GalaxyIcon";

interface DevBackendConfigModalProps {
  visible: boolean;
  eyebrow?: string;
  title: string;
  subtitle: string;
  submitLabel?: string;
  onClose: () => void;
  onSaved: () => void;
}

const DEV_PRESETS = [
  {
    label: "Wi-Fi: 192.168.100.51",
    url: "http://192.168.100.51:5000/api",
    icon: "smartphone" as const,
    highlighted: true,
  },
  {
    label: "Emulator (10.0.2.2)",
    url: "http://10.0.2.2:5000/api",
    icon: "cpu" as const,
    highlighted: false,
  },
  {
    label: "Localhost",
    url: "http://localhost:5000/api",
    icon: "monitor" as const,
    highlighted: false,
  },
];

/**
 * Development-only modal for switching local backend host URLs.
 * Renders nothing in production builds (!__DEV__).
 */
export const DevBackendConfigModal = ({
  visible,
  eyebrow = "Backend Endpoint",
  title,
  subtitle,
  submitLabel = "Save & Ping",
  onClose,
  onSaved,
}: DevBackendConfigModalProps) => {
  const [apiUrlInput, setApiUrlInput] = useState(galaxyApi.getBaseUrl());

  useEffect(() => {
    if (visible) {
      setApiUrlInput(galaxyApi.getBaseUrl());
    }
  }, [visible]);

  if (!__DEV__) {
    return null;
  }

  const handleSave = () => {
    const trimmed = apiUrlInput.trim();
    if (!trimmed) return;
    galaxyApi.setBaseUrl(trimmed);
    onClose();
    onSaved();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center items-center bg-black/85 px-6"
      >
        <View style={styles.card} className="rounded-3xl p-5 w-full max-w-sm">
          <View className="flex-row items-center">
            <View className="mr-1.5">
              <GalaxyIcon name="sparkles" size={11} color="#FF69B4" />
            </View>
            <Text className="text-[10px] font-bold uppercase tracking-widest text-[#FF69B4]">
              {eyebrow}
            </Text>
          </View>
          <Text className="text-lg font-black text-white mt-0.5 mb-1">
            {title}
          </Text>
          <Text className="text-xs text-[#FFB6C1]/80 mb-3">{subtitle}</Text>

          <View className="flex-row flex-wrap mb-3">
            {DEV_PRESETS.map((preset, idx) => (
              <TouchableOpacity
                key={preset.url}
                onPress={() => setApiUrlInput(preset.url)}
                className={`${idx < DEV_PRESETS.length - 1 ? "mr-2 " : ""}mb-2 px-2.5 py-1 rounded-full bg-[#140710] border ${
                  preset.highlighted ? "border-[#FF1493]" : "border-[#2E1122]"
                } flex-row items-center`}
              >
                <View className="mr-1">
                  <GalaxyIcon
                    name={preset.icon}
                    size={11}
                    color={preset.highlighted ? "#FF69B4" : "#FFB6C1"}
                  />
                </View>
                <Text
                  className={`text-[10px] font-bold ${
                    preset.highlighted ? "text-[#FF69B4]" : "text-[#FFB6C1]"
                  }`}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={apiUrlInput}
            onChangeText={setApiUrlInput}
            placeholder="http://localhost:5000/api"
            placeholderTextColor="#8A3B68"
            autoCapitalize="none"
            style={styles.input}
            className="rounded-xl px-3.5 py-2.5 text-xs text-white mb-4 font-mono"
          />

          <View className="flex-row">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#140710] border border-[#2E1122] items-center mr-2"
            >
              <Text className="text-xs font-bold text-[#FFB6C1]">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-[#FF1493] items-center"
            >
              <Text className="text-xs font-black text-black">{submitLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0D050A",
    borderWidth: 1.5,
    borderColor: "#FF1493",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  input: {
    backgroundColor: "#070306",
    borderWidth: 1,
    borderColor: "#3D182F",
  },
});
