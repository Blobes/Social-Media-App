"use client";

import { useMisc, useStyles } from "@funstakes/hooks";
import { Stack } from "@mui/material";
import { useGlobalContext } from "@funstakes/shared-state";
import { LeftNav } from "./navbars/LeftNav";
import { useTheme } from "@mui/material/styles";
import { BottomNav } from "./navbars/BottomNav";
import { useRef } from "react";
import { NetworkGlitchUI, RootUIContainer, OfflinePromptUI } from "@funstakes/shared-ui";
import { AppHeader } from "./navbars/Header";


export const DefaultWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isDesktop, isUnstableNetwork, isOffline } = useMisc();
  const theme = useTheme();
  const { authStatus, offlineMode, hideDefaultHeader } = useGlobalContext();
  const { scrollBarStyle } = useStyles();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Offline Prompt UI on App
  if (isOffline && !offlineMode) return <OfflinePromptUI />

  // Conditionally render the offline UI
  if ((isUnstableNetwork || authStatus === "ERROR") && !isOffline) {
    return <NetworkGlitchUI />;
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
          {!hideDefaultHeader && <AppHeader />}
          <Stack
            sx={{
              height: "100%",
              gap: theme.gap(0),
              overflowY: "hidden",
              overflowX: "auto",
              flexDirection: "row",
              width: "100%",
              ...scrollBarStyle(),
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
            ...scrollBarStyle(),
          }}>
          <AppHeader scrollRef={scrollRef} />
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
            ...scrollBarStyle(),
          }}>
          <AppHeader />
          {children}
        </Stack>
      )}
    </ RootUIContainer>)
}
