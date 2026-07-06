"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import globalTheme from "./globalTheme";
import { useAccessibilityStore } from "../store/useAccessibilityStore";

/**
 * Root wrapper delivering theme design tokens and updating user preference properties.
 */
export function GlobalThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontScale = useAccessibilityStore((state) => state.fontScale);
  const setPreferences = useAccessibilityStore((state) => state.setPreferences);
  const [activeLang, setActiveLang] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch initial configuration straight from localStorage on mount
    const savedLang = localStorage.getItem("app_lang") || "en";
    setActiveLang(savedLang);

    // 2. Event handler utilizing your existing cross-mfe sync payload channel
    const handleGlobalLangSync = (e: Event) => {
      const targetLang = (e as CustomEvent).detail;
      if (targetLang) {
        setActiveLang(targetLang);
      }
    };

    // 3. Bind directly to your built-in global runtime events
    window.addEventListener("GLOBAL_LANG_CHANGED", handleGlobalLangSync);
    setPreferences({ fontScale });

    return () => {
      window.removeEventListener("GLOBAL_LANG_CHANGED", handleGlobalLangSync);
    };
  }, [fontScale, setPreferences]);

  // Synchronize document direction properties when the local state variable changes
  useEffect(() => {
    if (!activeLang) return;
    const isRtl = activeLang === "ar";
    const root = document.documentElement;
    root.dir = isRtl ? "rtl" : "ltr";
    root.lang = activeLang;
    root.style.setProperty("--ui-text-align", isRtl ? "right" : "left");
  }, [activeLang]);

  return (
    <ThemeProvider theme={globalTheme} defaultMode="system">
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
