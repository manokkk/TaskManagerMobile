import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { UserProgress } from "../types/task";
import { GalaxyIcon } from "./GalaxyIcon";

interface GalaxyHeaderProps {
  progress: UserProgress;
  completedCount: number;
  totalCount: number;
  notificationsEnabled: boolean;
  backendOnline: boolean;
  onPressRankInfo?: () => void;
  onPressBackendConfig?: () => void;
  horizontalMargin?: number;
  hudPadding?: number;
  hudMarginBottom?: number;
  isSmallDevice?: boolean;
}

export const GalaxyHeader = ({
  progress,
  completedCount,
  totalCount,
  notificationsEnabled,
  backendOnline,
  onPressRankInfo,
  onPressBackendConfig,
  horizontalMargin = 16,
  hudPadding = 16,
  hudMarginBottom = 8,
  isSmallDevice = false,
}: GalaxyHeaderProps) => {
  return (
    <View
      style={[
        styles.hudContainer,
        {
          marginHorizontal: horizontalMargin,
          marginBottom: hudMarginBottom,
          padding: hudPadding,
        },
      ]}
      className="rounded-3xl"
    >
      {/* Decorative Star-Dust Accents (non-interactive, subtle ambient glow) */}
      <View pointerEvents="none" style={styles.starDotTopRight} />
      <View pointerEvents="none" style={styles.starDotBottomLeft} />

      {/* Top Row: Title & Rank Badge */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-1 mr-2">
          <TouchableOpacity
            onPress={onPressBackendConfig}
            disabled={!onPressBackendConfig}
            className="flex-row items-center"
            activeOpacity={0.7}
            accessibilityRole={onPressBackendConfig ? "button" : "text"}
            accessibilityLabel="Server connection status"
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: backendOnline ? "#FF1493" : "#8A3B68",
                },
              ]}
            />
            <Text
              numberOfLines={1}
              className="text-[10px] font-bold tracking-widest uppercase text-[#FF69B4] mr-1"
            >
              {backendOnline ? "Server Authoritative" : "Server Offline"}
            </Text>
            {onPressBackendConfig ? (
              <GalaxyIcon name="settings" size={11} color="#FF69B4" />
            ) : null}
          </TouchableOpacity>
          <Text
            numberOfLines={1}
            style={styles.headerTitle}
            className={`${
              isSmallDevice ? "text-xl" : "text-2xl"
            } font-black text-white tracking-tight mt-0.5`}
          >
            GALAXY QUEST
          </Text>
        </View>

        <TouchableOpacity
          onPress={onPressRankInfo}
          activeOpacity={0.8}
          style={styles.rankBadge}
          className={`${
            isSmallDevice ? "px-2.5 py-1" : "px-3 py-1.5"
          } rounded-full flex-row items-center`}
          accessibilityRole="button"
          accessibilityLabel="View rank progression details"
        >
          <View className="mr-1.5">
            <GalaxyIcon name="zap" size={14} color="#FF1493" />
          </View>
          <View>
            <View className="flex-row items-center">
              <Text className="text-[9px] uppercase tracking-widest text-[#FFB6C1] font-bold mr-1">
                Rank Tier
              </Text>
              <GalaxyIcon name="info" size={10} color="#FFB6C1" />
            </View>
            <Text className="text-xs font-extrabold text-[#FF1493] uppercase tracking-wider">
              {progress.rank}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Level & EXP Readout (Provided by Backend) */}
      <View className="flex-row items-baseline justify-between mb-2 flex-wrap">
        <View className="flex-row items-baseline mr-2">
          <Text
            style={styles.levelNumber}
            className={`${
              isSmallDevice ? "text-2xl" : "text-3xl"
            } font-black mr-2`}
          >
            LVL {progress.level}
          </Text>
          <Text className="text-xs font-semibold text-[#FFB6C1]/80">
            Total {progress.totalExp} EXP
          </Text>
        </View>

        <Text className="text-xs font-bold text-[#FF69B4]">
          {progress.currentLevelExp}{" "}
          <Text className="text-[#FFB6C1]/60 font-normal">
            / {progress.nextLevelCap} EXP ({progress.progressPercentage}%)
          </Text>
        </Text>
      </View>

      {/* Glowing Neon Pink EXP Progress Bar */}
      <View
        style={styles.progressTrack}
        className={`w-full ${
          isSmallDevice ? "h-3" : "h-3.5"
        } rounded-full overflow-hidden`}
      >
        <View
          style={[
            styles.progressFill,
            { width: `${Math.max(4, Math.min(100, progress.progressPercentage))}%` },
          ]}
          className="h-full rounded-full"
        />
      </View>

      {/* Sub-footer: Backend-Computed Scaling Math & Mission Telemetry */}
      <View className="flex-row items-center justify-between mt-2.5 pt-2 border-t border-[#2E1122]">
        <Text className="text-[10px] text-[#FFB6C1]/70 font-medium">
          Next Cap (1.5x):{" "}
          <Text className="text-[#FF69B4] font-bold">
            {progress.followingLevelCap} EXP
          </Text>
        </Text>

        <View className="flex-row items-center">
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: notificationsEnabled ? "#FF1493" : "#8A3B68",
              },
            ]}
          />
          <Text className="text-[10px] text-[#FFB6C1]/80 font-semibold">
            {completedCount}/{totalCount} Done
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hudContainer: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#FF1493",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    position: "relative",
    overflow: "hidden",
  },
  headerTitle: {
    letterSpacing: 0.5,
  },
  rankBadge: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#FF69B4",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  levelNumber: {
    color: "#FFFFFF",
    textShadowColor: "#FF1493",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  progressTrack: {
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  progressFill: {
    backgroundColor: "#FF1493",
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  starDotTopRight: {
    position: "absolute",
    top: 8,
    right: 18,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#FF69B4",
    opacity: 0.45,
  },
  starDotBottomLeft: {
    position: "absolute",
    bottom: 10,
    left: 20,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#FF1493",
    opacity: 0.5,
  },
});
