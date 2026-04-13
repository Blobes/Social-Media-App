"use client";

import React, { useRef } from "react";
import { Stack } from "@mui/material";
import { LeftNav } from "./LeftNav";
import { useTheme } from "@mui/material/styles";
import { BottomNav } from "./BottomNav";
import {
  NetworkGlitchUI,
  RootUIContainer,
  OfflinePromptUI,
} from "@repo/shared-ui";
import { AppHeader } from "./Header";
import { scrollBarStyle } from "@repo/helpers";
import { useGlobalContext, useMisc, useOffline } from "@repo/shared-state";

interface WrapperProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

export const DefaultWrapper = ({
  children,
  hideHeader = false,
}: WrapperProps) => {
  const { isDesktop } = useMisc();
  const theme = useTheme();
  const { authStatus } = useGlobalContext();
  const scrollRef = useRef<HTMLDivElement>(null);

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
              ...scrollBarStyle(theme),
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
            ...scrollBarStyle(theme),
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
            ...scrollBarStyle(theme),
          }}>
          {!hideHeader && <AppHeader />}
          {children}
        </Stack>
      )}
    </RootUIContainer>
  );
};
