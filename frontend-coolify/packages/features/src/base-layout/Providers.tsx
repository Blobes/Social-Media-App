"use client";

import React, { useEffect, useState, ReactNode, useRef } from "react";
import { useGlobalStore, useSocketStore } from "@repo/shared-hooks";
import { i18n as I18nInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { initializeLocalization } from "@repo/helpers";
import { SUPPORTED_ISO_CODES } from "@repo/core";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const token = useGlobalStore((state) => state.accessToken);
  const initializeSocket = useSocketStore((state) => state.initializeSocket);
  const disconnectSocket = useSocketStore((state) => state.disconnectSocket);

  useEffect(() => {
    if (token) {
      initializeSocket(token);
    } else {
      disconnectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [token, initializeSocket, disconnectSocket]);
  return <>{children}</>;
}

interface LanguageProviderProps {
  children: ReactNode;
  namespace: string;
}

/**
 * Client provider wrapping initialization loops and cross-mfe sync updates.
 */
export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  namespace,
}) => {
  const [instance, setInstance] = useState<I18nInstance | null>(null);

  // Track instance reference to bypass closure traps within structural event capture loops
  const instanceRef = useRef<I18nInstance | null>(null);

  useEffect(() => {
    let isMounted = true;
    const initialLang =
      typeof window !== "undefined"
        ? localStorage.getItem("app_lang") || "en"
        : "en";
    // Initialize isolated instance exactly once on mount
    initializeLocalization(namespace, initialLang, SUPPORTED_ISO_CODES).then(
      (mfeInstance) => {
        if (!isMounted) return;
        instanceRef.current = mfeInstance;
        setInstance(mfeInstance);
      },
    );
    return () => {
      isMounted = false;
    };
  }, [namespace]);

  useEffect(() => {
    // Dynamic message bus event routing controller execution block
    const syncLanguage = (e: Event) => {
      const targetLang = (e as CustomEvent).detail;
      if (instanceRef.current && instanceRef.current.language !== targetLang) {
        instanceRef.current.changeLanguage(targetLang);
      }
    };
    window.addEventListener("GLOBAL_LANG_CHANGED", syncLanguage);
    return () => {
      window.removeEventListener("GLOBAL_LANG_CHANGED", syncLanguage);
    };
  }, []);

  // Return fallback layout tree fragments during cold start up execution states
  if (!instance) return <>{children}</>;

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
};
