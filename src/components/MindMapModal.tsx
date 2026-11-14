import { useEffect, useMemo, useState } from "react";
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
import Svg, { Path } from "react-native-svg";
import { NoteMindMapBlock, NoteMindMapNode } from "../types/note";
import { createBlockId } from "../utils/noteDocument";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { GalaxyIcon } from "./GalaxyIcon";

const BRANCH_COLORS = [
  "#FF1493",
  "#38BDF8",
  "#10B981",
  "#FACC15",
  "#A855F7",
];

interface PositionedNode {
  node: NoteMindMapNode;
  x: number;
  y: number;
  depth: number;
}

function layoutMindMap(nodes: NoteMindMapNode[]): {
  positioned: PositionedNode[];
  edges: { from: PositionedNode; to: PositionedNode; color: string }[];
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { positioned: [], edges: [], width: 300, height: 140 };
  }

  const childrenMap = new Map<string, NoteMindMapNode[]>();
  let root: NoteMindMapNode | undefined;

  for (const n of nodes) {
    if (!n.parentId) {
      if (!root) root = n;
    } else {
      const arr = childrenMap.get(n.parentId) ?? [];
      arr.push(n);
      childrenMap.set(n.parentId, arr);
    }
  }

  if (!root) {
    root = nodes[0];
  }

  const NODE_W = 112;
  const NODE_H = 38;
  const H_GAP = 34;
  const V_GAP = 16;

  // Compute subtree leaf count for clean vertical distribution
  const leafCountCache = new Map<string, number>();
  const getLeafCount = (id: string, visited = new Set<string>()): number => {
    if (visited.has(id)) return 1;
    visited.add(id);
    if (leafCountCache.has(id)) return leafCountCache.get(id)!;
    const kids = childrenMap.get(id) ?? [];
    const count =
      kids.length === 0
        ? 1
        : kids.reduce((sum, k) => sum + getLeafCount(k.id, visited), 0);
    leafCountCache.set(id, count);
    return count;
  };

  const positioned: PositionedNode[] = [];
  const posById = new Map<string, PositionedNode>();
  let maxDepth = 0;

  const assignPositions = (
    node: NoteMindMapNode,
    depth: number,
    startY: number,
    visited = new Set<string>()
  ) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    maxDepth = Math.max(maxDepth, depth);

    const leaves = getLeafCount(node.id);
    const spanHeight = leaves * (NODE_H + V_GAP) - V_GAP;
    const x = 16 + depth * (NODE_W + H_GAP);
    const y = startY + spanHeight / 2 - NODE_H / 2;

    const p: PositionedNode = { node, x, y, depth };
    positioned.push(p);
    posById.set(node.id, p);

    const kids = childrenMap.get(node.id) ?? [];
    let cursorY = startY;
    for (const child of kids) {
      const childLeaves = getLeafCount(child.id);
      const childSpan = childLeaves * (NODE_H + V_GAP);
      assignPositions(child, depth + 1, cursorY, visited);
      cursorY += childSpan;
    }
  };

  assignPositions(root, 0, 16);

  const edges: { from: PositionedNode; to: PositionedNode; color: string }[] =
    [];
  for (const p of positioned) {
    if (p.node.parentId) {
      const parent = posById.get(p.node.parentId);
      if (parent) {
        edges.push({
          from: parent,
          to: p,
          color: p.node.color || "#FF69B4",
        });
      }
    }
  }

  const totalLeaves = getLeafCount(root.id);
  const width = Math.max(300, 32 + (maxDepth + 1) * (NODE_W + H_GAP) - H_GAP);
  const height = Math.max(130, 32 + totalLeaves * (NODE_H + V_GAP) - V_GAP);

  return { positioned, edges, width, height };
}

interface MindMapDiagramProps {
  nodes: NoteMindMapNode[];
  selectedNodeId?: string | null;
  onSelectNode?: (id: string) => void;
}

export const MindMapDiagram = ({
  nodes,
  selectedNodeId,
  onSelectNode,
}: MindMapDiagramProps) => {
  const { positioned, edges, width, height } = useMemo(
    () => layoutMindMap(nodes),
    [nodes]
  );

  const NODE_W = 112;
  const NODE_H = 38;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ minWidth: "100%" }}
    >
      <View style={{ width, height, position: "relative" }}>
        <Svg
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {edges.map((edge, idx) => {
            const x1 = edge.from.x + NODE_W;
            const y1 = edge.from.y + NODE_H / 2;
            const x2 = edge.to.x;
            const y2 = edge.to.y + NODE_H / 2;
            const midX = (x1 + x2) / 2;
            const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
            return (
              <Path
                key={`edge_${idx}`}
                d={d}
                stroke={edge.color}
                strokeWidth={2}
                fill="none"
                strokeOpacity={0.8}
              />
            );
          })}
        </Svg>

        {positioned.map((item) => {
          const isSelected = selectedNodeId === item.node.id;
          const borderColor = item.node.color || "#FF1493";
          return (
            <TouchableOpacity
              key={item.node.id}
              disabled={!onSelectNode}
              onPress={() => onSelectNode?.(item.node.id)}
              activeOpacity={0.8}
              style={[
                styles.nodeBox,
                {
                  left: item.x,
                  top: item.y,
                  width: NODE_W,
                  height: NODE_H,
                  borderColor: isSelected ? "#FFFFFF" : borderColor,
                  backgroundColor:
                    item.depth === 0 ? "#1D0714" : "#0F080D",
                  borderWidth: isSelected ? 2 : 1.2,
                },
              ]}
            >
              <Text
                numberOfLines={2}
                className="text-[11px] font-bold text-white text-center px-1.5"
              >
                {item.node.label || "Untitled"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

interface MindMapModalProps {
  visible: boolean;
  defaultTitle?: string;
  initialMindMap?: NoteMindMapBlock | null;
  onClose: () => void;
  onSave: (mindMap: { title: string; nodes: NoteMindMapNode[] }) => void;
}

export const MindMapModal = ({
  visible,
  defaultTitle = "Central Idea",
  initialMindMap,
  onClose,
  onSave,
}: MindMapModalProps) => {
  const { totalTopPadding, bottomInset, horizontalMargin } =
    useResponsiveLayout();

  const [nodes, setNodes] = useState<NoteMindMapNode[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [labelDraft, setLabelDraft] = useState("");

  useEffect(() => {
    if (!visible) return;

    if (initialMindMap && initialMindMap.nodes.length > 0) {
      setNodes(initialMindMap.nodes.map((n) => ({ ...n })));
      const root =
        initialMindMap.nodes.find((n) => !n.parentId) ??
        initialMindMap.nodes[0];
      setSelectedId(root.id);
      setLabelDraft(root.label);
    } else {
      const rootId = createBlockId("mm");
      const branchA = createBlockId("mm");
      const branchB = createBlockId("mm");
      const starter: NoteMindMapNode[] = [
        {
          id: rootId,
          label: defaultTitle.trim() || "Central Idea",
          parentId: null,
          color: "#FF1493",
        },
        {
          id: branchA,
          label: "Key Point 1",
          parentId: rootId,
          color: "#38BDF8",
        },
        {
          id: branchB,
          label: "Key Point 2",
          parentId: rootId,
          color: "#10B981",
        },
      ];
      setNodes(starter);
      setSelectedId(rootId);
      setLabelDraft(starter[0].label);
    }
  }, [visible, initialMindMap, defaultTitle]);

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? nodes[0];

  const handleSelectNode = (id: string) => {
    setSelectedId(id);
    const found = nodes.find((n) => n.id === id);
    if (found) {
      setLabelDraft(found.label);
    }
  };

  const handleChangeLabel = (text: string) => {
    setLabelDraft(text);
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedId ? { ...n, label: text } : n))
    );
  };

  const handleChangeColor = (color: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedId ? { ...n, color } : n))
    );
  };

  const handleAddBranch = () => {
    if (!selectedNode) return;
    const newId = createBlockId("mm");
    const nextColor =
      BRANCH_COLORS[nodes.length % BRANCH_COLORS.length];
    const newNode: NoteMindMapNode = {
      id: newId,
      label: "New Idea",
      parentId: selectedNode.id,
      color: nextColor,
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedId(newId);
    setLabelDraft("New Idea");
  };

  const handleDeleteNode = () => {
    if (!selectedNode || selectedNode.parentId === null) return;

    // Remove node and all descendants recursively
    const toRemove = new Set<string>([selectedNode.id]);
    let added = true;
    while (added) {
      added = false;
      for (const n of nodes) {
        if (n.parentId && toRemove.has(n.parentId) && !toRemove.has(n.id)) {
          toRemove.add(n.id);
          added = true;
        }
      }
    }

    const nextNodes = nodes.filter((n) => !toRemove.has(n.id));
    setNodes(nextNodes);
    const fallback =
      nextNodes.find((n) => n.id === selectedNode.parentId) ?? nextNodes[0];
    if (fallback) {
      setSelectedId(fallback.id);
      setLabelDraft(fallback.label);
    }
  };

  const handleSave = () => {
    const root = nodes.find((n) => !n.parentId) ?? nodes[0];
    onSave({
      title: root?.label.trim() || "Mind Map",
      nodes: nodes.map((n) => ({
        ...n,
        label: n.label.trim() || "Idea",
      })),
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[
          styles.container,
          {
            paddingTop: totalTopPadding,
            paddingBottom: Math.max(bottomInset, 14),
            paddingHorizontal: horizontalMargin,
          },
        ]}
      >
        {/* Top Bar */}
        <View className="flex-row items-center justify-between pb-3">
          <TouchableOpacity
            onPress={onClose}
            style={styles.toolBtn}
            className="w-9 h-9 rounded-full items-center justify-center"
            accessibilityLabel="Close mind map"
          >
            <GalaxyIcon name="close" size={16} color="#FFB6C1" />
          </TouchableOpacity>

          <View className="flex-row items-center">
            <GalaxyIcon name="mindmap" size={16} color="#F59E0B" />
            <Text className="text-sm font-black text-white uppercase tracking-wider ml-2">
              Mind Map
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveBtn}
            className="px-3.5 py-2 rounded-full flex-row items-center"
          >
            <GalaxyIcon name="check" size={14} color="#000000" strokeWidth={2.5} />
            <Text className="text-xs font-black text-black uppercase ml-1">
              Save
            </Text>
          </TouchableOpacity>
        </View>

        {/* Interactive Mind Map Canvas */}
        <ScrollView
          style={styles.canvasCard}
          className="flex-1 rounded-3xl p-2 my-2"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        >
          <MindMapDiagram
            nodes={nodes}
            selectedNodeId={selectedId}
            onSelectNode={handleSelectNode}
          />
        </ScrollView>

        {/* Selected Node Editor */}
        {selectedNode && (
          <View style={styles.controlsCard} className="rounded-2xl p-3.5 mt-1">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-[#FF69B4]">
                {selectedNode.parentId === null
                  ? "Central Topic (Tap nodes above to select)"
                  : "Selected Branch"}
              </Text>
              {selectedNode.parentId !== null && (
                <TouchableOpacity
                  onPress={handleDeleteNode}
                  className="flex-row items-center px-2 py-1 rounded-lg bg-[#1F0712] border border-[#FF1493]/40"
                >
                  <GalaxyIcon name="trash" size={11} color="#FF1493" />
                  <Text className="text-[10px] font-bold text-[#FF1493] ml-1">
                    Remove
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="flex-row items-center mb-3">
              <TextInput
                value={labelDraft}
                onChangeText={handleChangeLabel}
                placeholder="Branch text..."
                placeholderTextColor="#8A3B68"
                style={styles.inputField}
                className="flex-1 rounded-xl px-3.5 py-2.5 text-white text-sm mr-2"
              />
              <TouchableOpacity
                onPress={handleAddBranch}
                style={styles.addBranchBtn}
                className="px-3.5 py-2.5 rounded-xl flex-row items-center"
              >
                <GalaxyIcon name="plus" size={13} color="#000000" strokeWidth={2.5} />
                <Text className="text-xs font-black text-black ml-1">
                  Branch
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-[#8A3B68]">
                Node Color
              </Text>
              <View className="flex-row items-center">
                {BRANCH_COLORS.map((c) => {
                  const active = (selectedNode.color || "#FF1493") === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => handleChangeColor(c)}
                      style={[
                        styles.colorDot,
                        { backgroundColor: c },
                        active && styles.colorDotSelected,
                      ]}
                      className="ml-2"
                    />
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  toolBtn: {
    backgroundColor: "#140710",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  saveBtn: {
    backgroundColor: "#FF1493",
  },
  canvasCard: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  controlsCard: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  inputField: {
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  addBranchBtn: {
    backgroundColor: "#FF69B4",
  },
  nodeBox: {
    position: "absolute",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#2E1122",
  },
  colorDotSelected: {
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    transform: [{ scale: 1.12 }],
  },
});
