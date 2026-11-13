import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { AuthUser, UserProgress } from "../types/task";
import { galaxyApi } from "../services/api";
import { sessionStorage } from "../services/sessionStorage";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { GalaxyIcon } from "../components/GalaxyIcon";

interface SettingsScreenProps {
  currentUser: AuthUser | null;
  sessionExpiresAt?: number | null;
  progress: UserProgress;
  backendOnline: boolean;
  databaseStatus: string;
  onLogout: () => void;
  onRefreshHealth: () => void;
}

export const SettingsScreen = ({
  currentUser,
  sessionExpiresAt,
  progress,
  backendOnline,
  databaseStatus,
  onLogout,
  onRefreshHealth,
}: SettingsScreenProps) => {
  const { totalTopPadding, horizontalMargin, isSmallDevice, isTablet, maxContentWidth, bottomInset } =
    useResponsiveLayout();

  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(galaxyApi.getBaseUrl());
  const sessionInfo = sessionStorage.getRemainingTimeInfo(
    sessionExpiresAt ?? null
  );

  const handleConfirmLogout = () => {
    Alert.alert(
      "Log Out of Command Deck",
      "Are you sure you want to end this session? You will be returned to the Log In / Sign Up screen.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: onLogout,
        },
      ]
    );
  };

  const handleSaveApiUrl = () => {
    if (apiUrlInput.trim()) {
      galaxyApi.setBaseUrl(apiUrlInput.trim());
      setConfigModalVisible(false);
      onRefreshHealth();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: totalTopPadding,
          paddingBottom: (isSmallDevice ? 90 : 100) + Math.max(bottomInset, 8),
          paddingHorizontal: horizontalMargin,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: isTablet ? 500 : maxContentWidth, alignSelf: "center" }}>
          {/* Header */}
          <View className="mb-5">
            <View className="flex-row items-center">
              <View className="mr-1.5">
                <GalaxyIcon name="sparkles" size={11} color="#FF69B4" />
              </View>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-[#FF69B4]">
                System & Commander Matrix
              </Text>
            </View>
            <Text className="text-2xl font-black text-white mt-0.5">
              Command Deck Settings
            </Text>
          </View>

          {/* Commander Profile Card */}
          <View style={styles.card} className="rounded-3xl p-4 mb-4">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-[#FFB6C1] mb-2">
              Authenticated Commander
            </Text>

            <View className="flex-row items-center mb-3">
              <View style={styles.avatarBox} className="mr-3 items-center justify-center">
                <GalaxyIcon name="shield" size={22} color="#FF1493" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-black text-white" numberOfLines={1}>
                  {currentUser ? currentUser.username : "Guest Cadet"}
                </Text>
                <Text className="text-xs font-mono text-[#FF69B4]" numberOfLines={1}>
                  {currentUser ? currentUser.email : "guest@galaxy.local"}
                </Text>
              </View>
            </View>

            <View className="pt-2.5 border-t border-[#2E1122] flex-row justify-between">
              <View>
                <Text className="text-[10px] text-[#FFB6C1]/70">Standing</Text>
                <Text className="text-xs font-bold text-white mt-0.5">
                  LVL {progress.level} • <Text className="text-[#FF1493]">{progress.rank}</Text>
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px] text-[#FFB6C1]/70">Total EXP</Text>
                <Text className="text-xs font-black text-[#FF1493] mt-0.5">
                  {progress.totalExp} EXP
                </Text>
              </View>
            </View>

            {currentUser && (
              <View className="mt-2.5 pt-2.5 border-t border-[#2E1122] flex-row items-center justify-between">
                <Text className="text-[10px] text-[#FFB6C1]/70">7-Day Session</Text>
                <View className="flex-row items-center">
                  <View className="mr-1.5">
                    <GalaxyIcon name="clock" size={12} color="#10B981" />
                  </View>
                  <Text className="text-[11px] font-mono font-bold text-[#10B981]">
                    {sessionInfo.label}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Supabase Database Telemetry */}
          <View style={styles.card} className="rounded-3xl p-4 mb-4">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-[#FFB6C1] mb-2.5">
              Supabase Cloud Database
            </Text>

            <View style={styles.infoRow} className="flex-row items-center justify-between py-2 border-b border-[#1F0B17]">
              <Text className="text-xs text-[#FFB6C1]">PostgreSQL Status</Text>
              <View className="flex-row items-center">
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        backendOnline && databaseStatus === "connected"
                          ? "#10B981"
                          : "#FF1493",
                    },
                  ]}
                />
                <Text
                  className={`text-xs font-bold ${
                    backendOnline && databaseStatus === "connected"
                      ? "text-[#10B981]"
                      : "text-[#FF69B4]"
                  }`}
                >
                  {backendOnline && databaseStatus === "connected"
                    ? "Online & Synchronized"
                    : "Unreachable"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow} className="flex-row items-center justify-between py-2 border-b border-[#1F0B17]">
              <Text className="text-xs text-[#FFB6C1]">Database Region</Text>
              <Text className="text-xs font-mono text-white/90">aws-0-ap-south-1</Text>
            </View>

            <View style={styles.infoRow} className="flex-row items-center justify-between py-2 border-b border-[#1F0B17]">
              <Text className="text-xs text-[#FFB6C1]">Prisma Schema Tables</Text>
              <Text className="text-xs font-mono text-[#FF69B4]">User, Task, UserProfile</Text>
            </View>

            <View style={styles.infoRow} className="flex-row items-center justify-between py-2">
              <Text className="text-xs text-[#FFB6C1]">Pooler Mode</Text>
              <Text className="text-xs font-mono text-white/90">Transaction (6543) / Direct (5432)</Text>
            </View>
          </View>

          {/* Server Connection & Bridge */}
          <View style={styles.card} className="rounded-3xl p-4 mb-4">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-[#FFB6C1] mb-2.5">
              Backend Endpoint Bridge
            </Text>

            <View className="mb-3">
              <Text className="text-[10px] text-[#FFB6C1]/70 mb-1">Current Active URL</Text>
              <Text className="text-xs font-mono text-[#FF69B4] bg-[#050505] p-2.5 rounded-xl border border-[#2E1122]">
                {galaxyApi.getBaseUrl()}
              </Text>
            </View>

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setConfigModalVisible(true)}
                style={styles.secondaryButton}
                className="flex-1 py-2.5 rounded-xl items-center justify-center flex-row mr-2"
              >
                <Text className="text-xs font-bold text-[#FFB6C1] mr-1.5">Change Host IP</Text>
                <GalaxyIcon name="settings" size={13} color="#FFB6C1" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onRefreshHealth}
                style={styles.pingButton}
                className="flex-1 py-2.5 rounded-xl items-center justify-center flex-row"
              >
                <Text className="text-xs font-black text-black mr-1.5">Ping Backend</Text>
                <GalaxyIcon name="radio" size={13} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Log Out Danger Zone */}
          <View style={styles.logoutCard} className="rounded-3xl p-4 mb-6">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-[#FF1493] mb-1">
              Command Deck Security
            </Text>
            <Text className="text-xs text-[#FFB6C1]/80 mb-3">
              Terminates local session authorization and returns to the Log In / Sign Up gateway.
            </Text>

            <TouchableOpacity
              onPress={handleConfirmLogout}
              style={styles.logoutButton}
              className="py-3 rounded-2xl items-center justify-center flex-row"
              activeOpacity={0.8}
            >
              <View className="mr-2">
                <GalaxyIcon name="logout" size={14} color="#FFFFFF" />
              </View>
              <Text className="text-xs font-black text-white uppercase tracking-wider">
                Log Out of Command Deck
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-center text-[10px] font-mono text-[#FFB6C1]/50 mb-2">
            Galaxy Quest RPG • Build v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Backend API Configuration Modal */}
      <Modal
        visible={configModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfigModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-center items-center bg-black/85 px-6"
        >
          <View style={styles.configModalCard} className="rounded-3xl p-5 w-full max-w-sm">
            <View className="flex-row items-center">
              <View className="mr-1.5">
                <GalaxyIcon name="sparkles" size={11} color="#FF69B4" />
              </View>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-[#FF69B4]">
                Backend Endpoint
              </Text>
            </View>
            <Text className="text-lg font-black text-white mt-0.5 mb-1">
              Configure Server IP
            </Text>
            <Text className="text-xs text-[#FFB6C1]/80 mb-3">
              Set the host address of TaskManagerBackend (port 5000).
            </Text>

            {/* Quick Presets */}
            <View className="flex-row flex-wrap mb-3">
              <TouchableOpacity
                onPress={() => setApiUrlInput("http://192.168.100.51:5000/api")}
                className="mr-2 mb-2 px-2.5 py-1 rounded-full bg-[#140710] border border-[#FF1493] flex-row items-center"
              >
                <View className="mr-1">
                  <GalaxyIcon name="smartphone" size={11} color="#FF69B4" />
                </View>
                <Text className="text-[10px] font-bold text-[#FF69B4]">
                  Wi-Fi: 192.168.100.51
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setApiUrlInput("http://10.0.2.2:5000/api")}
                className="mr-2 mb-2 px-2.5 py-1 rounded-full bg-[#140710] border border-[#2E1122] flex-row items-center"
              >
                <View className="mr-1">
                  <GalaxyIcon name="cpu" size={11} color="#FFB6C1" />
                </View>
                <Text className="text-[10px] font-bold text-[#FFB6C1]">
                  Emulator (10.0.2.2)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setApiUrlInput("http://localhost:5000/api")}
                className="mb-2 px-2.5 py-1 rounded-full bg-[#140710] border border-[#2E1122] flex-row items-center"
              >
                <View className="mr-1">
                  <GalaxyIcon name="monitor" size={11} color="#FFB6C1" />
                </View>
                <Text className="text-[10px] font-bold text-[#FFB6C1]">
                  Localhost
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={apiUrlInput}
              onChangeText={setApiUrlInput}
              placeholder="http://192.168.100.51:5000/api"
              placeholderTextColor="#8A3B68"
              autoCapitalize="none"
              style={styles.modalInput}
              className="rounded-xl px-3.5 py-2.5 text-xs text-white mb-4 font-mono"
            />

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setConfigModalVisible(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#140710] border border-[#2E1122] items-center mr-2"
              >
                <Text className="text-xs font-bold text-[#FFB6C1]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveApiUrl}
                className="flex-1 py-2.5 rounded-xl bg-[#FF1493] items-center"
              >
                <Text className="text-xs font-black text-black">Save & Ping</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  card: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#140710",
    borderWidth: 1.5,
    borderColor: "#FF1493",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  infoRow: {},
  secondaryButton: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  pingButton: {
    backgroundColor: "#FF1493",
  },
  logoutCard: {
    backgroundColor: "#17050E",
    borderWidth: 1,
    borderColor: "#FF1493",
  },
  logoutButton: {
    backgroundColor: "#E11D48",
    borderWidth: 1,
    borderColor: "#FB7185",
    shadowColor: "#E11D48",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  configModalCard: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1.5,
    borderColor: "#FF1493",
  },
  modalInput: {
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
});

