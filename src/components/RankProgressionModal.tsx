import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { GamificationMetadata, UserProgress } from "../types/task";

interface RankProgressionModalProps {
  visible: boolean;
  progress: UserProgress;
  metadata: GamificationMetadata;
  onClose: () => void;
}

export const RankProgressionModal = ({
  visible,
  progress,
  metadata,
  onClose,
}: RankProgressionModalProps) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/90 px-5">
        <View
          style={styles.modalCard}
          className="w-full max-h-[85%] rounded-3xl p-5"
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-widest text-[#FF69B4]">
                  ✦ Server-Authoritative RPG Matrix
                </Text>
                <Text className="text-xl font-black text-white mt-0.5">
                  Cosmic Rank Codex
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-[#140710] border border-[#FF1493] items-center justify-center"
              >
                <Text className="text-[#FF1493] font-bold text-sm">✕</Text>
              </TouchableOpacity>
            </View>

            {/* Active Player Telemetry */}
            <View
              style={styles.telemetryBox}
              className="p-3.5 rounded-2xl mb-4 flex-row items-center justify-between"
            >
              <View>
                <Text className="text-[10px] uppercase tracking-wider text-[#FFB6C1] font-bold">
                  Current Standing
                </Text>
                <Text className="text-lg font-black text-white mt-0.5">
                  Level {progress.level} •{" "}
                  <Text className="text-[#FF1493]">{progress.rank}</Text>
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px] uppercase tracking-wider text-[#FFB6C1] font-bold">
                  Next Level Cap
                </Text>
                <Text className="text-sm font-extrabold text-[#FF69B4] mt-0.5">
                  {progress.currentLevelExp} / {progress.nextLevelCap} EXP
                </Text>
              </View>
            </View>

            {/* EXP Rewards Specification (From Backend Metadata) */}
            <Text className="text-xs font-bold uppercase tracking-wider text-[#FFB6C1] mb-2">
              Mission EXP Bounties
            </Text>
            <View className="flex-row mb-4">
              {(["Daily", "Weekly", "Monthly"] as const).map((category) => (
                <View
                  key={category}
                  style={styles.bountyBox}
                  className="flex-1 py-2.5 mx-1 rounded-2xl items-center"
                >
                  <Text className="text-[10px] font-bold uppercase text-[#FFB6C1]">
                    {category}
                  </Text>
                  <Text className="text-sm font-black text-[#FF1493] mt-0.5">
                    +{metadata.expRewards[category]} EXP
                  </Text>
                </View>
              ))}
            </View>

            {/* Ranking Tiers (Lv 1 - 100, From Backend Metadata) */}
            <Text className="text-xs font-bold uppercase tracking-wider text-[#FFB6C1] mb-2">
              Galaxy Ranking Tiers
            </Text>
            <View className="mb-4">
              {metadata.rankTiers.map((tier) => {
                const isCurrent = progress.rank === tier.rank;
                const isUnlocked = progress.level >= tier.minLevel;
                return (
                  <View
                    key={tier.rank}
                    style={isCurrent ? styles.tierActive : styles.tierInactive}
                    className="flex-row items-center justify-between px-3.5 py-2.5 rounded-2xl mb-2"
                  >
                    <View className="flex-row items-center">
                      <Text className="text-base mr-2.5">{tier.insignia}</Text>
                      <View>
                        <Text
                          className={`text-xs font-black uppercase ${
                            isCurrent
                              ? "text-[#FF1493]"
                              : isUnlocked
                              ? "text-white"
                              : "text-[#8A3B68]"
                          }`}
                        >
                          {tier.rank}
                        </Text>
                        <Text className="text-[10px] text-[#FFB6C1]/70">
                          {tier.levelRange}
                        </Text>
                      </View>
                    </View>

                    <View
                      className={`px-2.5 py-0.5 rounded-full ${
                        isCurrent
                          ? "bg-[#FF1493]"
                          : isUnlocked
                          ? "bg-[#140710]"
                          : "bg-black"
                      }`}
                    >
                      <Text
                        className={`text-[9px] font-black uppercase ${
                          isCurrent
                            ? "text-black"
                            : isUnlocked
                            ? "text-[#FF69B4]"
                            : "text-[#8A3B68]"
                        }`}
                      >
                        {isCurrent
                          ? "Active"
                          : isUnlocked
                          ? "Unlocked"
                          : "Locked"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* 1.5x Exponential Scaling Formula Preview (From Backend Metadata) */}
            <Text className="text-xs font-bold uppercase tracking-wider text-[#FFB6C1] mb-1">
              1.5x Exponential Leveling Curve
            </Text>
            <Text className="text-[10px] text-[#FFB6C1]/70 mb-2">
              Server Formula: Next Cap = Math.floor(Current Cap × 1.5)
            </Text>
            <View
              style={styles.bountyBox}
              className="rounded-2xl p-3 mb-4"
            >
              {metadata.sampleLevelCaps.map((row) => (
                <View
                  key={row.level}
                  className="flex-row items-center justify-between py-1 border-b border-[#1A0913]"
                >
                  <Text className="text-[11px] font-bold text-white">
                    Level {row.level} → Level {row.level + 1}
                  </Text>
                  <Text className="text-[11px] font-mono font-bold text-[#FF69B4]">
                    {row.cap} EXP
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              className="py-3 rounded-2xl items-center"
            >
              <Text className="text-black font-black text-xs uppercase tracking-wider">
                Return to Command Deck
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalCard: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1.5,
    borderColor: "#FF1493",
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
    maxWidth: 480,
  },
  telemetryBox: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#FF69B4",
  },
  bountyBox: {
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  tierActive: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#FF1493",
  },
  tierInactive: {
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "#1F0B17",
  },
  closeButton: {
    backgroundColor: "#FF1493",
    borderWidth: 1,
    borderColor: "#FF69B4",
  },
});
