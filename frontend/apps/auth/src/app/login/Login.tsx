"use client";

import { useTheme } from "@mui/material/styles";
import { LoginStepper } from "./LoginStepper";
import { Stack } from "@mui/material";
import { useGlobalContext } from "@shared-state";
import { clientRoutes } from "@helpers";
import { Empty } from "@shared-ui";
import { ShieldCheck } from "lucide-react";
import { useStyles, usePage, useMisc } from "@hooks";
import { ComfirmLogout } from "@shared-ui";


export const Login = () => {
  const theme = useTheme();
  const { authStatus } = useGlobalContext();
  const { openModal } = useMisc();
  const { applyBGPattern } = useStyles()
  const { navigateTo } = usePage()

  return (
    <Stack
      sx={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.boxSpacing(6),
        //Pattern background with fade effect
        ...applyBGPattern()
      }}>
      {authStatus === "UNAUTHENTICATED" ? (
        <LoginStepper
          style={{
            container: {
              width: "400px",
              padding: theme.boxSpacing(18, 16),
              mobile: {
                padding: theme.boxSpacing(16, 10),
              },
            },
          }}
        />
      ) : (
        <Empty
          headline="You are already signed in"
          tagline="Return to funstakes.com or logout."
          style={{
            container: {
              padding: theme.boxSpacing(18),
              backgroundColor: theme.palette.gray[0],
              border: `1px solid ${theme.fixedColors.mainTrans}`
            },
            primaryCta: { width: "100%" },
            icon: {
              width: "40px",
              height: "40px",
            },
          }}
          icon={<ShieldCheck />}
          primaryCta={{
            label: "Go to Funstakes.com",
            action: () => navigateTo(clientRoutes.home),
            href: clientRoutes.home.path
          }}
          secondaryCta={{
            label: "Logout",
            action: () => openModal({ content: <ComfirmLogout /> })
          }}
        />
      )}
    </Stack>
  );
}
