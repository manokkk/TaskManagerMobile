import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GalaxyIcon } from "./GalaxyIcon";

interface SessionLoadingScreenProps {
  statusMessage?: string;
}

export const SessionLoadingScreen = ({
  statusMessage = "Checking 7-day login session...",
}: SessionLoadingScreenProps) => {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Decorative Star Dust Elements */}
      <View pointerEvents="none" style={styles.starDot1} />
      <View pointerEvents="none" style={styles.starDot2} />
      <View pointerEvents="none" style={styles.starDot3} />

      <View style={styles.card} className="rounded-3xl p-6 items-center mx-6">
        <View
          style={styles.emblemCircle}
          className="mb-4 items-center justify-center"
        >
          <GalaxyIcon name="galaxy" size={34} color="#FF1493" />
        </View>

        <Text
          style={styles.heroTitle}
          className="text-2xl font-black text-white tracking-wider"
        >
          GALAXY QUEST
        </Text>

        <View className="flex-row items-center mt-1 mb-5">
          <GalaxyIcon name="sparkles" size={11} color="#FF69B4" />
          <Text className="text-[10px] font-bold uppercase tracking-widest text-[#FF69B4] mx-1.5">
            7-Day Session Security Check
          </Text>
          <GalaxyIcon name="sparkles" size={11} color="#FF69B4" />
        </View>

        <View
          style={styles.statusBox}
          className="w-full rounded-2xl p-4 items-center"
        >
          <ActivityIndicator size="large" color="#FF1493" />
          <Text className="text-xs font-bold text-white mt-3 text-center">
            {statusMessage}
          </Text>
          <Text className="text-[10px] text-[#FFB6C1]/70 mt-1 text-center">
            Sessions stay active for 7 days before resetting to Log In
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "88%",
    maxWidth: 380,
    backgroundColor: "#0B0B0B",
    borderWidth: 1.5,
    borderColor: "#FF1493",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
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
  statusBox: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  starDot1: {
    position: "absolute",
    top: 80,
    right: 45,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#FF69B4",
    opacity: 0.7,
  },
  starDot2: {
    position: "absolute",
    bottom: 90,
    left: 35,
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: "#FF1493",
    opacity: 0.6,
  },
  starDot3: {
    position: "absolute",
    top: 200,
    left: 25,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#FFB6C1",
    opacity: 0.5,
  },
});

