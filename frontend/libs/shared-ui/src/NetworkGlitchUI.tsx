"use client"

import { useTheme } from "@mui/material";
import { Empty } from "./Empty";
import { Unplug } from "lucide-react";
import { ProgressIcon } from "./LoadingUIs";
import { useGlobalContext } from "@funstakes/shared-state";
import { RootUIContainer } from "./Containers";
import { useMisc } from "@funstakes/hooks";

export const NetworkGlitchUI = () => {
  const theme = useTheme();
  const { checkingSignal } = useGlobalContext();
  const { isUnstableNetwork } = useMisc();

  return (
    <RootUIContainer
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: theme.gap(30)
      }}>
      {isUnstableNetwork && checkingSignal ? (
        <ProgressIcon otherProps={{ size: "30px" }} info="Retrieving connection..." />
      ) :
        (<Empty
          headline="Oops, something went wrong"
          tagline="Check your internet connection."
          icon={<Unplug />}
          primaryCta={{
            label: "Refresh",
            variant: "outlined",
            action: () => window.location.reload(),
          }}
          style={{
            container: { padding: theme.boxSpacing(16), background: "none" },
            icon: {
              width: "60px",
              height: "60px",
              marginBottom: theme.boxSpacing(10)
            },
          }}
        />
        )}
    </RootUIContainer>
  )
};
