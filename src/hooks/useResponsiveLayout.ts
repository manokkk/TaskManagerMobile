import { useWindowDimensions, Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface ResponsiveLayout {
  width: number;
  height: number;
  isSmallDevice: boolean;
  isLargeDevice: boolean;
  isTablet: boolean;
  rawTopInset: number;
  topMargin: number;
  totalTopPadding: number;
  horizontalMargin: number;
  bottomInset: number;
  fabBottom: number;
  listBottomPadding: number;
  hudPadding: number;
  hudMarginBottom: number;
  maxContentWidth: number;
}

/**
 * Calculates responsive spacing, insets, and margins tailored to the user's specific device.
 * Prevents content from rendering too high (under status bar/notch/punch-hole)
 * or too low (wasting vertical screen space or getting obscured by home indicator).
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Screen categorization
  const isSmallDevice = height < 700 || width < 360;
  const isLargeDevice = height >= 880;
  const isTablet = width >= 600;

  // Safe top spacing calculation:
  // On Android, insets.top might be 0 if translucent is false, or 24-48px if translucent is true.
  // Fall back to StatusBar.currentHeight to ensure we never overlap system status bar.
  const androidStatusBar = StatusBar.currentHeight ?? 0;
  const rawTopInset =
    Platform.OS === "android"
      ? Math.max(insets.top, androidStatusBar)
      : insets.top;

  // Responsive top margin below the status bar / notch:
  // Small screen (<700dp): 4dp - compact so HUD doesn't push task list down too low
  // Standard screen (700-879dp): 8dp - comfortable breathing room
  // Tall screen (>=880dp): 12dp - balanced luxury spacing
  const topMargin = isSmallDevice ? 4 : isLargeDevice ? 12 : 8;
  const totalTopPadding = rawTopInset + topMargin;

  // Responsive horizontal margins:
  // Compact phones: 12dp
  // Standard phones: 16dp
  // Tablets / Large screens: 20dp (content constrained by maxContentWidth)
  const horizontalMargin = isSmallDevice ? 12 : isTablet ? 20 : 16;

  // Bottom safe area offset:
  // Accounts for iPhone home indicator bar (34dp) and Android gesture bars (16-24dp).
  const bottomInset = insets.bottom;
  const fabBottom = Math.max(16, bottomInset + (isSmallDevice ? 10 : 16));
  const listBottomPadding = fabBottom + (isSmallDevice ? 72 : 82);

  // HUD Card inner padding & margin
  const hudPadding = isSmallDevice ? 14 : isLargeDevice ? 18 : 16;
  const hudMarginBottom = isSmallDevice ? 6 : 8;

  // Center-aligned max width on tablets/foldables so it doesn't stretch awkwardly
  const maxContentWidth = isTablet ? 600 : width;

  return {
    width,
    height,
    isSmallDevice,
    isLargeDevice,
    isTablet,
    rawTopInset,
    topMargin,
    totalTopPadding,
    horizontalMargin,
    bottomInset,
    fabBottom,
    listBottomPadding,
    hudPadding,
    hudMarginBottom,
    maxContentWidth,
  };
}

