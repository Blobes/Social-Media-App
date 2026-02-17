"use client";

import { useMisc } from "@funstakes/hooks";
import { useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import { RightSidebar } from "./sidebar/RightSidebar";
import { useGlobalContext } from "@funstakes/shared-state";
import { Welcome } from "./components/Welcome";
import { Feed } from "./Feed";

export const FeedWrapper = () => {
  const { isDesktop } = useMisc();
  const theme = useTheme();
  const { authStatus } = useGlobalContext();

  return (
    <>
      {authStatus === "AUTHENTICATED" && (
        isDesktop ? (
          <Stack sx={{
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
        )
      )}
      {authStatus === "UNAUTHENTICATED" && (
        <Welcome />
      )}
    </>
  )

}