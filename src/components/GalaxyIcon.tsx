import React from "react";
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from "react-native-svg";
import { RankTier } from "../types/task";

export type GalaxyIconName =
  | "galaxy"
  | "grid"
  | "rocket"
  | "note"
  | "settings"
  | "plus"
  | "check"
  | "check-circle"
  | "close"
  | "edit"
  | "trash"
  | "bell"
  | "clock"
  | "calendar"
  | "sparkles"
  | "zap"
  | "info"
  | "search"
  | "alert"
  | "refresh"
  | "shield"
  | "user"
  | "mail"
  | "lock"
  | "logout"
  | "radio"
  | "smartphone"
  | "cpu"
  | "monitor"
  | "star"
  | "crown"
  | "compass"
  | "arrow-right"
  | "arrow-left"
  | "undo"
  | "redo"
  | "ai-pen"
  | "waveform"
  | "image"
  | "squiggle"
  | "checkbox-square"
  | "text-format"
  | "mindmap"
  | "eraser"
  | "mic";

interface GalaxyIconProps {
  name: GalaxyIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function getRankIconName(rank: RankTier): GalaxyIconName {
  switch (rank) {
    case "Rookie":
      return "compass";
    case "Veteran":
      return "rocket";
    case "Elite":
      return "zap";
    case "Master":
      return "star";
    case "Legendary":
      return "crown";
    default:
      return "shield";
  }
}

export const GalaxyIcon: React.FC<GalaxyIconProps> = ({
  name,
  size = 18,
  color = "#FF1493",
  strokeWidth = 2,
}) => {
  switch (name) {
    case "galaxy":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M4.93 19.07C2.5 16.64 3.5 11.5 8 7c4.5-4.5 9.64-5.5 12.07-3.07 2.43 2.43 1.43 7.57-3.07 12.07-4.5 4.5-9.64 5.5-12.07 3.07Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Circle cx="18.5" cy="5.5" r="1.2" fill={color} />
          <Circle cx="5.5" cy="18.5" r="1.2" fill={color} />
        </Svg>
      );

    case "grid":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );

    case "rocket":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "note":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polyline
            points="14 2 14 8 20 8"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="8" y1="17" x2="13" y2="17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case "settings":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "plus":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
          <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
        </Svg>
      );

    case "check":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline
            points="20 6 9 17 4 12"
            stroke={color}
            strokeWidth={strokeWidth + 0.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "check-circle":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polyline
            points="22 4 12 14.01 9 11.01"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "close":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case "edit":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "trash":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline
            points="3 6 5 6 21 6"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "bell":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "clock":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
          <Polyline
            points="12 6 12 12 16 14"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "calendar":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth={strokeWidth} />
          <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case "sparkles":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "zap":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polygon
            points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "info":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
          <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="12" y1="8" x2="12.01" y2="8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case "search":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={strokeWidth} />
          <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case "alert":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case "refresh":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="23 4 23 10 17 10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="1 20 1 14 7 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path
            d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "shield":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "user":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );

    case "mail":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "lock":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M7 11V7a5 5 0 0 1 10 0v4"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "logout":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case "radio":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "smartphone":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke={color} strokeWidth={strokeWidth} />
          <Line x1="12" y1="18" x2="12.01" y2="18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case "cpu":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="9" y="9" width="6" height="6" stroke={color} strokeWidth={strokeWidth} />
          <Line x1="9" y1="1" x2="9" y2="4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="15" y1="1" x2="15" y2="4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="9" y1="20" x2="9" y2="23" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="15" y1="20" x2="15" y2="23" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case "monitor":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke={color} strokeWidth={strokeWidth} />
          <Line x1="8" y1="21" x2="16" y2="21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="12" y1="17" x2="12" y2="21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case "star":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "crown":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "compass":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
          <Polygon
            points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "arrow-right":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Polyline points="12 5 19 12 12 19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case "arrow-left":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="19" y1="12" x2="5" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Polyline points="12 19 5 12 12 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case "undo":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="9 14 4 9 9 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case "redo":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="15 14 20 9 15 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case "ai-pen":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15.5 4.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M5 3v3M3.5 4.5h3"
            stroke="#FF69B4"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Path
            d="M19 15v3M17.5 16.5h3"
            stroke="#38BDF8"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );

    case "waveform":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="4" y1="10" x2="4" y2="14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="8" y1="7" x2="8" y2="17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="12" y1="4" x2="12" y2="20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="16" y1="7" x2="16" y2="17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="20" y1="10" x2="20" y2="14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case "image":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="16" rx="2.5" stroke={color} strokeWidth={strokeWidth} />
          <Circle cx="8.5" cy="9.5" r="1.5" fill={color} />
          <Polyline points="21 15 16 10 5 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case "squiggle":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 17c2.5-6 4.5-10 6.5-10s1.5 9 3.5 9 3-7 5-7c1 0 1.5 2 1.5 3"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "checkbox-square":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3.5" y="3.5" width="17" height="17" rx="3.5" stroke={color} strokeWidth={strokeWidth} />
          <Polyline points="8.5 12 11 14.5 16 9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case "text-format":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="5" y1="6" x2="19" y2="6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="12" y1="6" x2="12" y2="19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="9" y1="19" x2="15" y2="19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case "mindmap":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="9.5" width="5.5" height="5" rx="1.2" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="15.5" y="4" width="5.5" height="4.5" rx="1.2" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="15.5" y="15.5" width="5.5" height="4.5" rx="1.2" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M8.5 12h3.5V6.25h3.5M12 12v5.75h3.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case "eraser":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M22 21H7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="m5 11 9 9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case "mic":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="9" y="2" width="6" height="11" rx="3" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="12" y1="19" x2="12" y2="22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
  }
};

