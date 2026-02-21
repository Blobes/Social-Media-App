"use client";

import { useMisc } from "../hooks/useMisc";
import { useOffline } from "../hooks/useOffline";
import { Stack } from "@mui/material";
import { useGlobalContext } from "../GlobalContext";
import { LeftNav } from "./navbars/LeftNav";
import { useTheme } from "@mui/material/styles";
import { BottomNav } from "./navbars/BottomNav";
import { useRef } from "react";
import { NetworkGlitchUI, RootUIContainer, OfflinePromptUI } from "@repo/shared-ui";
import { AppHeader } from "./navbars/Header";
import { scrollBarStyle } from "@repo/helpers";

interface WrapperProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

export const DefaultWrapper = ({ children, hideHeader = false }: WrapperProps) => {
  const { isDesktop, isUnstableNetwork, isOffline } = useMisc();
  const theme = useTheme();
  const { authStatus, offlineMode, checkingSignal } = useGlobalContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Offline Prompt UI on App
  if (isOffline && !offlineMode) return <OfflinePromptUI
    handleOffline={useOffline().switchToOfflineMode} />

  // Conditionally render the offline UI
  if ((isUnstableNetwork || authStatus === "ERROR") && !isOffline) {
    return <NetworkGlitchUI checkingSignal={checkingSignal} isUnstableNetwork={isUnstableNetwork} />;
  }

  return (
    <RootUIContainer>
      {/* Logged in & on desktop */}
      {authStatus === "AUTHENTICATED" && isDesktop && (
        <Stack
          sx={{
            height: "100%",
            gap: theme.gap(0),
            overflowY: "hidden",
            flexDirection: "column",
          }}>
          {!hideHeader && <AppHeader />}
          <Stack
            sx={{
              height: "100%",
              gap: theme.gap(0),
              overflowY: "hidden",
              overflowX: "auto",
              flexDirection: "row",
              width: "100%",
              ...scrollBarStyle(isDesktop, theme),
            }}>
            <LeftNav />
            {children}
          </Stack>
        </Stack>
      )}

      {/* Logged in and NOT on a desktop screen */}
      {authStatus === "AUTHENTICATED" && !isDesktop && (
        <Stack
          ref={scrollRef}
          sx={{
            height: "100%",
            gap: theme.gap(0),
            overflowY: "auto",
            justifyContent: "flex-start",
            alignItems: "center",
            flexDirection: "column",
            paddingBottom: theme.boxSpacing(23),
            ...scrollBarStyle(isDesktop, theme),
          }}>
          {!hideHeader && <AppHeader scrollRef={scrollRef} />}
          {children}
          <BottomNav scrollRef={scrollRef} />
        </Stack>
      )}

      {/* Not logged in on every screen size */}
      {authStatus !== "AUTHENTICATED" && (
        <Stack
          sx={{
            height: "100%",
            gap: theme.gap(0),
            overflowY: "auto",
            flexDirection: "column",
            [theme.breakpoints.down("md")]: {
              justifyContent: "flex-start",
              alignItems: "center",
            },
            ...scrollBarStyle(isDesktop, theme),
          }}>
          {!hideHeader && <AppHeader />}
          {children}
        </Stack>
      )}
    </ RootUIContainer>)
}
