"use client";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ProfileCard } from "./Cards";
import { Followers } from "./Followers";
import { ScrollableContainer } from "@/components/Containers";
import { useAppContext } from "../AppContext";
import { AppButton } from "@/components/Buttons";
import { useRouter } from "next/navigation";

export const LeftSide = () => {
  const theme = useTheme();
  const { loginStatus } = useAppContext();

  return (
    <ScrollableContainer
      sx={{
        width: "28%",
        minWidth: "300px",
        maxWidth: "500px",
        [theme.breakpoints.down("md")]: { display: "none" },
        gap: theme.gap(8),
        padding: theme.boxSpacing(8, 16),
      }}>
      {loginStatus === "AUTHENTICATED" ? (
        <>
          <ProfileCard />
          <Typography variant="subtitle1" sx={{ width: "100%" }}>
            Those following you
          </Typography>
          <Followers />
        </>
      ) : (
        <Stack>
          <Typography component="h5">
            Join millions of stakers on FunStakes
          </Typography>
          <AppButton onClick={() => useRouter().replace("/auth/login")}>
            Get started
          </AppButton>
        </Stack>
      )}
    </ScrollableContainer>
  );
};
