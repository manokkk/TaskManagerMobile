import { ComponentRef, RefObject, useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  TextInputFocusEvent,
} from "react-native";

type ScrollViewHandle = ComponentRef<typeof ScrollView>;

interface UseScrollToFocusedInputOptions {
  /** External ScrollView ref if the component already manages one. */
  scrollViewRef?: RefObject<ScrollViewHandle | null>;
  /** Extra clearance above the keyboard (e.g., for a sticky toolbar or button). */
  extraOffset?: number;
  /** Whether the hook is currently active (e.g., modal visible). Defaults to true. */
  enabled?: boolean;
}

export const FOCUS_HIGHLIGHT_STYLE = {
  borderColor: "#FF1493",
  shadowColor: "#FF1493",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.35,
  shadowRadius: 8,
  elevation: 4,
} as const;

/**
 * Scrolls the enclosing ScrollView so the currently focused TextInput stays
 * visible above the software keyboard, and tracks which input is focused for
 * visual highlight styling.
 */
export function useScrollToFocusedInput(
  options: UseScrollToFocusedInputOptions = {}
) {
  const { scrollViewRef: externalRef, extraOffset = 24, enabled = true } = options;
  const internalRef = useRef<ScrollViewHandle | null>(null);
  const scrollViewRef = externalRef ?? internalRef;

  const scrollYRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const focusedTargetRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const clearPendingTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scrollToTarget = useCallback(
    (target: any, kbHeightOverride?: number) => {
      const scrollView = scrollViewRef.current;
      if (
        !scrollView ||
        !target ||
        typeof target.measureInWindow !== "function"
      ) {
        return;
      }

      const kbHeight = kbHeightOverride ?? keyboardHeightRef.current;
      const windowHeight = Dimensions.get("window").height;
      const effectiveKbHeight = kbHeight > 0 ? kbHeight : 300;
      const visibleBottom = windowHeight - effectiveKbHeight - extraOffset;

      target.measureInWindow(
        (_x: number, y: number, _width: number, height: number) => {
          if (!Number.isFinite(y) || !Number.isFinite(height)) return;
          const inputBottom = y + height;

          if (inputBottom > visibleBottom) {
            const delta = inputBottom - visibleBottom + 16;
            scrollView.scrollTo({
              y: Math.max(0, scrollYRef.current + delta),
              animated: true,
            });
          } else if (y < 72) {
            const delta = 72 - y;
            scrollView.scrollTo({
              y: Math.max(0, scrollYRef.current - delta),
              animated: true,
            });
          }
        }
      );
    },
    [extraOffset, scrollViewRef]
  );

  const scheduleScrollToFocused = useCallback(
    (delayMs: number, kbHeightOverride?: number) => {
      clearPendingTimer();
      timerRef.current = setTimeout(() => {
        if (focusedTargetRef.current) {
          scrollToTarget(focusedTargetRef.current, kbHeightOverride);
        }
      }, delayMs);
    },
    [clearPendingTimer, scrollToTarget]
  );

  useEffect(() => {
    if (!enabled) {
      focusedTargetRef.current = null;
      setFocusedKey(null);
      setKeyboardHeight(0);
      keyboardHeightRef.current = 0;
      clearPendingTimer();
      return;
    }

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e.endCoordinates?.height ?? 0;
      keyboardHeightRef.current = height;
      setKeyboardHeight(height);
      if (focusedTargetRef.current) {
        scheduleScrollToFocused(Platform.OS === "ios" ? 60 : 120, height);
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      clearPendingTimer();
    };
  }, [clearPendingTimer, enabled, scheduleScrollToFocused]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollYRef.current = e.nativeEvent.contentOffset.y;
    },
    []
  );

  const handleFocus = useCallback(
    (
      key: string,
      e?: TextInputFocusEvent,
      onExtraFocus?: () => void
    ) => {
      setFocusedKey(key);
      if (e?.target) {
        focusedTargetRef.current = e.target;
      }
      onExtraFocus?.();
      scheduleScrollToFocused(Platform.OS === "ios" ? 80 : 160);
    },
    [scheduleScrollToFocused]
  );

  const handleBlur = useCallback((key: string, onExtraBlur?: () => void) => {
    setFocusedKey((prev) => (prev === key ? null : prev));
    onExtraBlur?.();
  }, []);

  const ensureFocusedVisible = useCallback(() => {
    if (focusedTargetRef.current) {
      scheduleScrollToFocused(60);
    }
  }, [scheduleScrollToFocused]);

  return {
    scrollViewRef,
    focusedKey,
    keyboardHeight,
    onScroll,
    handleFocus,
    handleBlur,
    ensureFocusedVisible,
  };
}
