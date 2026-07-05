"use client";

import { create } from "zustand";

export type FontScaleLevel = "small" | "normal" | "large" | "extra-large";
export type ContrastMode = "normal" | "high";
export type MotionPreference = "full" | "reduced";
export type DensityPreference = "comfortable" | "compact";

interface AccessibilityPreferences {
  fontScale: FontScaleLevel;
  contrastMode: ContrastMode;
  motion: MotionPreference;
  density: DensityPreference;
  dyslexiaFont: boolean;
}

interface AccessibilityStore extends AccessibilityPreferences {
  setPreferences: (prefs: Partial<AccessibilityPreferences>) => void;
  resetPreferences: () => void;
}

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  fontScale: "normal",
  contrastMode: "normal",
  motion: "full",
  density: "comfortable",
  dyslexiaFont: false,
};

const SCALE_FACTORS: Record<FontScaleLevel, string> = {
  small: "0.85",
  normal: "1.00",
  large: "1.15",
  "extra-large": "1.30",
};

/**
 * Manages user preference values and maps selection variables onto document nodes.
 */
export const useAccessibilityStore = create<AccessibilityStore>((set) => ({
  ...DEFAULT_PREFERENCES,

  setPreferences: (prefs) =>
    set((state) => {
      const updated = { ...state, ...prefs };

      if (typeof window !== "undefined") {
        const root = document.documentElement;

        if (prefs.fontScale) {
          root.style.setProperty(
            "--ui-font-scale",
            SCALE_FACTORS[prefs.fontScale],
          );
        }

        if (prefs.contrastMode) {
          root.setAttribute("data-ui-contrast", updated.contrastMode);
        }

        if (prefs.motion) {
          root.setAttribute("data-ui-motion", updated.motion);
        }

        if (prefs.density) {
          root.setAttribute("data-ui-density", updated.density);
        }

        if (prefs.dyslexiaFont !== undefined) {
          root.setAttribute(
            "data-ui-dyslexia",
            updated.dyslexiaFont ? "true" : "false",
          );
        }
      }

      return updated;
    }),

  resetPreferences: () => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--ui-font-scale", SCALE_FACTORS.normal);
      root.setAttribute("data-ui-contrast", "normal");
      root.setAttribute("data-ui-motion", "full");
      root.setAttribute("data-ui-density", "comfortable");
      root.setAttribute("data-ui-dyslexia", "false");
    }
    set(DEFAULT_PREFERENCES);
  },
}));
