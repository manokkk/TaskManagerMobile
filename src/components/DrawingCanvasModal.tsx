import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { NoteDrawingBlock, NoteDrawingStroke } from "../types/note";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { GalaxyIcon } from "./GalaxyIcon";

interface DrawingCanvasModalProps {
  visible: boolean;
  initialDrawing?: NoteDrawingBlock | null;
  onClose: () => void;
  onSave: (drawing: {
    width: number;
    height: number;
    strokes: NoteDrawingStroke[];
  }) => void;
}

const PEN_COLORS = [
  "#FFFFFF",
  "#FF1493",
  "#FF69B4",
  "#38BDF8",
  "#10B981",
  "#FACC15",
];

const PEN_WIDTHS = [
  { label: "Thin", value: 2.5 },
  { label: "Med", value: 5 },
  { label: "Bold", value: 9 },
];

export const DrawingCanvasModal = ({
  visible,
  initialDrawing,
  onClose,
  onSave,
}: DrawingCanvasModalProps) => {
  const { totalTopPadding, bottomInset, horizontalMargin } =
    useResponsiveLayout();

  const [strokes, setStrokes] = useState<NoteDrawingStroke[]>([]);
  const [redoStrokes, setRedoStrokes] = useState<NoteDrawingStroke[]>([]);
  const [activePath, setActivePath] = useState<string>("");
  const [penColor, setPenColor] = useState("#FF69B4");
  const [penWidth, setPenWidth] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 340, height: 420 });

  const activePathRef = useRef("");
  const penColorRef = useRef(penColor);
  const penWidthRef = useRef(penWidth);
  const isEraserRef = useRef(isEraser);
  const canvasSizeRef = useRef(canvasSize);

  penColorRef.current = penColor;
  penWidthRef.current = penWidth;
  isEraserRef.current = isEraser;
  canvasSizeRef.current = canvasSize;

  useEffect(() => {
    if (!visible) return;
    setStrokes(initialDrawing?.strokes ? [...initialDrawing.strokes] : []);
    setRedoStrokes([]);
    setActivePath("");
    activePathRef.current = "";
    setIsEraser(false);
  }, [visible, initialDrawing]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const x = Math.max(0, Math.min(canvasSizeRef.current.width, locationX));
          const y = Math.max(0, Math.min(canvasSizeRef.current.height, locationY));
          const startPath = `M ${x.toFixed(1)} ${y.toFixed(1)} L ${(x + 0.1).toFixed(1)} ${(y + 0.1).toFixed(1)}`;
          activePathRef.current = startPath;
          setActivePath(startPath);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const x = Math.max(0, Math.min(canvasSizeRef.current.width, locationX));
          const y = Math.max(0, Math.min(canvasSizeRef.current.height, locationY));
          const nextPath = `${activePathRef.current} L ${x.toFixed(1)} ${y.toFixed(1)}`;
          activePathRef.current = nextPath;
          setActivePath(nextPath);
        },
        onPanResponderRelease: () => {
          const finalized = activePathRef.current;
          if (finalized) {
            const newStroke: NoteDrawingStroke = {
              color: isEraserRef.current ? "#0B0B0B" : penColorRef.current,
              width: isEraserRef.current
                ? penWidthRef.current * 2.4
                : penWidthRef.current,
              path: finalized,
            };
            setStrokes((prev) => [...prev, newStroke]);
            setRedoStrokes([]);
          }
          activePathRef.current = "";
          setActivePath("");
        },
        onPanResponderTerminate: () => {
          activePathRef.current = "";
          setActivePath("");
        },
      }),
    []
  );

  const handleUndo = () => {
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStrokes((r) => [...r, last]);
      return prev.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setRedoStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setStrokes((s) => [...s, last]);
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    if (strokes.length === 0) return;
    setRedoStrokes([]);
    setStrokes([]);
  };

  const handleDone = () => {
    onSave({
      width: Math.round(canvasSize.width),
      height: Math.round(canvasSize.height),
      strokes,
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
      <View
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
            accessibilityLabel="Cancel drawing"
          >
            <GalaxyIcon name="close" size={16} color="#FFB6C1" />
          </TouchableOpacity>

          <Text className="text-sm font-black text-white uppercase tracking-wider">
            Sketch Pad
          </Text>

          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleUndo}
              disabled={strokes.length === 0}
              style={[
                styles.toolBtn,
                strokes.length === 0 && { opacity: 0.35 },
              ]}
              className="w-9 h-9 rounded-full items-center justify-center mr-1.5"
              accessibilityLabel="Undo stroke"
            >
              <GalaxyIcon name="undo" size={15} color="#FFB6C1" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRedo}
              disabled={redoStrokes.length === 0}
              style={[
                styles.toolBtn,
                redoStrokes.length === 0 && { opacity: 0.35 },
              ]}
              className="w-9 h-9 rounded-full items-center justify-center mr-2"
              accessibilityLabel="Redo stroke"
            >
              <GalaxyIcon name="redo" size={15} color="#FFB6C1" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDone}
              style={styles.doneBtn}
              className="px-3.5 py-2 rounded-full flex-row items-center"
            >
              <GalaxyIcon name="check" size={14} color="#000000" strokeWidth={2.5} />
              <Text className="text-xs font-black text-black uppercase ml-1">
                Insert
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Drawing Surface */}
        <View
          style={styles.canvasCard}
          className="flex-1 rounded-3xl overflow-hidden my-2"
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width > 0 && height > 0) {
              setCanvasSize({ width, height });
            }
          }}
          {...panResponder.panHandlers}
        >
          <Svg width="100%" height="100%">
            {strokes.map((stroke, idx) => (
              <Path
                key={`stroke_${idx}`}
                d={stroke.path}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            {activePath ? (
              <Path
                d={activePath}
                stroke={isEraser ? "#0B0B0B" : penColor}
                strokeWidth={isEraser ? penWidth * 2.4 : penWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : null}
          </Svg>

          {strokes.length === 0 && !activePath ? (
            <View
              pointerEvents="none"
              className="absolute inset-0 items-center justify-center"
            >
              <GalaxyIcon name="squiggle" size={32} color="#2E1122" />
              <Text className="text-xs text-[#8A3B68] mt-2">
                Draw freely with your finger
              </Text>
            </View>
          ) : null}
        </View>

        {/* Bottom Pen Controls */}
        <View style={styles.controlsCard} className="rounded-2xl p-3 mt-1">
          <View className="flex-row items-center justify-between mb-3">
            {/* Colors */}
            <View className="flex-row items-center">
              {PEN_COLORS.map((c) => {
                const selected = !isEraser && penColor === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      setIsEraser(false);
                      setPenColor(c);
                    }}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      selected && styles.colorDotSelected,
                    ]}
                    className="mr-2.5"
                  />
                );
              })}
            </View>

            {/* Eraser & Clear */}
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setIsEraser((prev) => !prev)}
                style={[
                  styles.toolBtn,
                  isEraser && styles.eraserActive,
                ]}
                className="px-2.5 py-1.5 rounded-xl flex-row items-center mr-2"
              >
                <GalaxyIcon
                  name="eraser"
                  size={13}
                  color={isEraser ? "#000000" : "#FFB6C1"}
                />
                <Text
                  className={`text-[10px] font-bold ml-1 ${
                    isEraser ? "text-black" : "text-[#FFB6C1]"
                  }`}
                >
                  Eraser
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClear}
                style={styles.toolBtn}
                className="px-2.5 py-1.5 rounded-xl"
              >
                <Text className="text-[10px] font-bold text-[#FF69B4]">
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stroke Width */}
          <View className="flex-row items-center justify-between">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-[#8A3B68]">
              Stroke Size
            </Text>
            <View className="flex-row items-center">
              {PEN_WIDTHS.map((w) => {
                const active = penWidth === w.value;
                return (
                  <TouchableOpacity
                    key={w.label}
                    onPress={() => setPenWidth(w.value)}
                    style={active ? styles.widthActive : styles.toolBtn}
                    className="px-3 py-1 rounded-full ml-1.5"
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        active ? "text-black" : "text-[#FFB6C1]"
                      }`}
                    >
                      {w.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
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
  doneBtn: {
    backgroundColor: "#FF1493",
  },
  canvasCard: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1.5,
    borderColor: "#2E1122",
  },
  controlsCard: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#2E1122",
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#2E1122",
  },
  colorDotSelected: {
    borderWidth: 2.5,
    borderColor: "#FF1493",
    transform: [{ scale: 1.12 }],
  },
  eraserActive: {
    backgroundColor: "#FF69B4",
    borderColor: "#FF69B4",
  },
  widthActive: {
    backgroundColor: "#FF1493",
    borderWidth: 1,
    borderColor: "#FF69B4",
  },
});
