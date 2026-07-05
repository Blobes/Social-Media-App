"use client";

import React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Feed } from "./Feed";
import { RightSidebar } from "./sidebar/RightSidebar";
import { Welcome } from "./Welcome";
import { useMisc } from "@repo/shared-hooks";
import { useGlobalStore } from "@repo/core";

export default function HomePage() {
  const { isDesktop } = useMisc();
  const theme = useTheme();
  const authStatus = useGlobalStore((state) => state.authStatus);

  return (
    <>
      {authStatus === "AUTHENTICATED" &&
        (isDesktop ? (
          <Stack
            sx={{
              height: "100%",
              flexDirection: "row",
              gap: 0,
              overflow: "hidden",
              width: "100%",
            }}>
            <Feed />
            <RightSidebar />
          </Stack>
        ) : (
          <Feed />
        ))}
      {authStatus === "UNAUTHENTICATED" && <Welcome />}
    </>
  );
}
