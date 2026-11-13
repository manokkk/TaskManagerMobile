import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthUser } from "../types/task";
import { galaxyApi } from "../services/api";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";

interface AuthScreenProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
  onContinueAsGuest: () => void;
  backendOnline: boolean;
  databaseStatus: string;
  onRefreshHealth: () => void;
  sessionResetNotice?: string | null;
  onClearSessionNotice?: () => void;
}

export const AuthScreen = ({
  onLoginSuccess,
  onContinueAsGuest,
  backendOnline,
  databaseStatus,
  onRefreshHealth,
  sessionResetNotice,
  onClearSessionNotice,
}: AuthScreenProps) => {
  const { totalTopPadding, horizontalMargin, isSmallDevice, isTablet, maxContentWidth } =
    useResponsiveLayout();

  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Whenever a 7-day session reset occurs, ensure the user is straight on the Log In tab
  useEffect(() => {
    if (sessionResetNotice) {
      setIsSignUp(false);
    }
  }, [sessionResetNotice]);

  // Server endpoint quick configuration modal
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(galaxyApi.getBaseUrl());

  const handleAuthSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    onClearSessionNotice?.();

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both Cosmic ID (Email) and Security Cipher.");
      return;
    }

    if (isSignUp && !username.trim()) {
      setErrorMessage("Please designate your Commander Call-Sign.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Security cipher must contain at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const response = await galaxyApi.register({
          email: email.trim(),
          password: password.trim(),
          username: username.trim(),
        });
        setSuccessMessage("Commander record created in Supabase database!");
        setTimeout(() => {
          onLoginSuccess(response.user, response.token);
        }, 300);
      } else {
        const response = await galaxyApi.login({
          email: email.trim(),
          password: password.trim(),
        });
        setSuccessMessage("Command Deck access verified!");
        setTimeout(() => {
          onLoginSuccess(response.user, response.token);
        }, 300);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Authentication transmission failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiUrl = () => {
    if (apiUrlInput.trim()) {
      galaxyApi.setBaseUrl(apiUrlInput.trim());
      setConfigModalVisible(false);
      onRefreshHealth();
    }
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar style="light" />

      {/* Decorative Star Dust Elements */}
      <View pointerEvents="none" style={styles.starDot1} />
      <View pointerEvents="none" style={styles.starDot2} />
      <View pointerEvents="none" style={styles.starDot3} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingTop: totalTopPadding,
            paddingBottom: 24,
            paddingHorizontal: horizontalMargin,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.contentWrapper,
              { maxWidth: isTablet ? 460 : maxContentWidth },
            ]}
          >
            {/* Top Emblem & Brand Header */}
            <View className="items-center mb-6">
              <View style={styles.emblemCircle} className="mb-3 items-center justify-center">
                <Text style={{ fontSize: isSmallDevice ? 32 : 38 }}>🌌</Text>
              </View>

              <Text
                style={styles.heroTitle}
                className={`${isSmallDevice ? "text-2xl" : "text-3xl"} font-black text-white tracking-wider`}
              >
                GALAXY QUEST
              </Text>

              <Text className="text-[10px] font-bold uppercase tracking-widest text-[#FF69B4] mt-1">
                ✦ Space-Grade Mission Command Deck ✦
              </Text>

              {/* Supabase PostgreSQL Status Pill */}
              <TouchableOpacity
                onPress={() => setConfigModalVisible(true)}
                activeOpacity={0.8}
                style={styles.statusPill}
                className="mt-3 px-3.5 py-1.5 rounded-full flex-row items-center"
              >
                <View
                  style={[
                    styles.statusIndicatorDot,
                    {
                      backgroundColor:
                        backendOnline && databaseStatus === "connected"
                          ? "#10B981"
                          : "#FF1493",
                    },
                  ]}
                />
                <Text className="text-[10px] font-mono text-white/90">
                  Supabase:{" "}
                  <Text
                    className={
                      backendOnline && databaseStatus === "connected"
                        ? "text-[#10B981] font-bold"
                        : "text-[#FF69B4] font-bold"
                    }
                  >
                    {backendOnline && databaseStatus === "connected"
                      ? "Connected"
                      : "Server Offline"}
                  </Text>
                  <Text className="text-[9px] text-[#FFB6C1]/70"> (Tap ⚙️)</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Auth Glass Card */}
            <View style={styles.cardContainer} className="rounded-3xl p-5 mb-4">
              {/* Mode Toggle Tabs */}
              <View style={styles.tabTrack} className="flex-row p-1 rounded-2xl mb-5">
                <TouchableOpacity
                  onPress={() => {
                    setIsSignUp(false);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  style={[!isSignUp && styles.tabActive]}
                  className="flex-1 py-2.5 items-center rounded-xl"
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-xs font-black uppercase tracking-wider ${
                      !isSignUp ? "text-black" : "text-[#FFB6C1]"
                    }`}
                  >
                    Log In
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setIsSignUp(true);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  style={[isSignUp && styles.tabActive]}
                  className="flex-1 py-2.5 items-center rounded-xl"
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-xs font-black uppercase tracking-wider ${
                      isSignUp ? "text-black" : "text-[#FFB6C1]"
                    }`}
                  >
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 7-Day Session Reset Banner */}
              {sessionResetNotice && !errorMessage && !successMessage && (
                <View style={styles.resetNoticeBox} className="p-3 rounded-xl mb-4 flex-row items-center">
                  <Text className="text-xs text-[#FFB6C1] flex-1 font-semibold">
                    🔄 {sessionResetNotice}
                  </Text>
                </View>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <View style={styles.errorBox} className="p-3 rounded-xl mb-4 flex-row items-center">
                  <Text className="text-xs text-[#FF69B4] flex-1 font-medium">
                    ⚠️ {errorMessage}
                  </Text>
                </View>
              )}

              {/* Success Banner */}
              {successMessage && (
                <View style={styles.successBox} className="p-3 rounded-xl mb-4 flex-row items-center">
                  <Text className="text-xs text-[#10B981] flex-1 font-bold">
                    ✓ {successMessage}
                  </Text>
                </View>
              )}

              {/* Commander Call-Sign (Sign Up Only) */}
              {isSignUp && (
                <View className="mb-3.5">
                  <Text className="text-[10px] uppercase font-bold tracking-widest text-[#FFB6C1] mb-1.5">
                    🎖️ Commander Call-Sign
                  </Text>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="e.g. Captain Nova"
                    placeholderTextColor="#8A3B68"
                    autoCapitalize="words"
                    style={styles.inputBox}
                    className="rounded-2xl px-4 py-3 text-sm text-white font-medium"
                  />
                </View>
              )}

              {/* Cosmic ID (Email) */}
              <View className="mb-3.5">
                <Text className="text-[10px] uppercase font-bold tracking-widest text-[#FFB6C1] mb-1.5">
                  ✉️ Cosmic ID (Email)
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="commander@galaxy.space"
                  placeholderTextColor="#8A3B68"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.inputBox}
                  className="rounded-2xl px-4 py-3 text-sm text-white font-mono"
                />
              </View>

              {/* Security Cipher (Password) */}
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-[10px] uppercase font-bold tracking-widest text-[#FFB6C1]">
                    🔐 Security Cipher (Password)
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text className="text-[10px] font-bold text-[#FF69B4]">
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#8A3B68"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={styles.inputBox}
                  className="rounded-2xl px-4 py-3 text-sm text-white font-mono"
                />
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity
                onPress={handleAuthSubmit}
                disabled={loading}
                style={styles.submitButton}
                className="py-3.5 rounded-2xl items-center mb-3"
                activeOpacity={0.8}
              >
                {loading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#000000" />
                    <Text className="text-xs font-black text-black ml-2 uppercase tracking-wider">
                      Transmitting to Supabase...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-xs font-black text-black uppercase tracking-wider">
                    {isSignUp
                      ? "Commission Commander in Supabase 🚀"
                      : "Launch Command Deck 🔐"}
                  </Text>
                )}
              </TouchableOpacity>

              <Text className="text-center text-[10px] text-[#FFB6C1]/60">
                {isSignUp
                  ? "Saves encrypted record to Supabase & starts a 7-day login session."
                  : "Keeps your login session active for 7 days before resetting."}
              </Text>
            </View>

            {/* Guest / Preview Bypass Option */}
            <View className="items-center">
              <TouchableOpacity
                onPress={onContinueAsGuest}
                className="px-4 py-2"
                activeOpacity={0.7}
              >
                <Text className="text-xs font-semibold text-[#FFB6C1]/75 underline">
                  Continue as Guest Cadet (Preview Mode) →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
          <View style={styles.configCard} className="rounded-3xl p-5 w-full max-w-sm">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-[#FF69B4]">
              ✦ Backend Endpoint Link
            </Text>
            <Text className="text-lg font-black text-white mt-0.5 mb-1">
              Server & Supabase Bridge
            </Text>
            <Text className="text-xs text-[#FFB6C1]/80 mb-3">
              Configure your backend IP to bridge between your mobile device and Supabase.
            </Text>

            {/* Quick Presets */}
            <View className="flex-row flex-wrap mb-3">
              <TouchableOpacity
                onPress={() => setApiUrlInput("http://192.168.100.51:5000/api")}
                className="mr-2 mb-2 px-2.5 py-1 rounded-full bg-[#140710] border border-[#FF1493]"
              >
                <Text className="text-[10px] font-bold text-[#FF69B4]">
                  📱 Wi-Fi: 192.168.100.51
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setApiUrlInput("http://10.0.2.2:5000/api")}
                className="mr-2 mb-2 px-2.5 py-1 rounded-full bg-[#140710] border border-[#2E1122]"
              >
                <Text className="text-[10px] font-bold text-[#FFB6C1]">
                  🤖 Emulator (10.0.2.2)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setApiUrlInput("http://localhost:5000/api")}
                className="mb-2 px-2.5 py-1 rounded-full bg-[#140710] border border-[#2E1122]"
              >
                <Text className="text-[10px] font-bold text-[#FFB6C1]">
                  💻 Localhost
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={apiUrlInput}
              onChangeText={setApiUrlInput}
              placeholder="http://192.168.100.51:5000/api"
              placeholderTextColor="#8A3B68"
              autoCapitalize="none"
              style={styles.inputBox}
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
  screenContainer: {
    flex: 1,
    backgroundColor: "#050505",
  },
  contentWrapper: {
    width: "100%",
    alignSelf: "center",
  },
  emblemCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#140710",
    borderWidth: 2,
    borderColor: "#FF1493",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    textShadowColor: "#FF1493",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  statusPill: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  cardContainer: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1.5,
    borderColor: "#FF1493",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  tabTrack: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  tabActive: {
    backgroundColor: "#FF1493",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  inputBox: {
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  errorBox: {
    backgroundColor: "#2E0A1A",
    borderWidth: 1,
    borderColor: "#FF1493",
  },
  resetNoticeBox: {
    backgroundColor: "#1F0B17",
    borderWidth: 1,
    borderColor: "#FF69B4",
  },
  successBox: {
    backgroundColor: "#062816",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  submitButton: {
    backgroundColor: "#FF1493",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  configCard: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1.5,
    borderColor: "#FF1493",
  },
  starDot1: {
    position: "absolute",
    top: 50,
    right: 40,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#FF69B4",
    opacity: 0.7,
  },
  starDot2: {
    position: "absolute",
    bottom: 80,
    left: 30,
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: "#FF1493",
    opacity: 0.6,
  },
  starDot3: {
    position: "absolute",
    top: 180,
    left: 20,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#FFB6C1",
    opacity: 0.5,
  },
});

