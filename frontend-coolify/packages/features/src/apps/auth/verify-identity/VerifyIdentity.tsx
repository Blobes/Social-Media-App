"use client";

import React, { useMemo } from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Stepper } from "@repo/shared-ui";
import { VerifyIdentityMethod, TransitPurpose, IStep } from "@repo/core";
import { useVerifyIdentity, VerifyIdentityProps } from "./useVerifyIdentity";
import { TotpView } from "./totp/Totp";
import { MessagingOtpView } from "./messaging/MessagingOtp";

/**
 * Primary identity verification controller handling dynamic method switching and steps layout.
 */
export const VerifyIdentity = <P extends TransitPurpose>(
  props: VerifyIdentityProps<P>,
) => {
  const {
    transitData,
    initialMethod,
    customMethods,
    onSuccess,
    onRateLimitExceeded,
    isBotChallengeAllowed,
    setShouldRestrict,
    containerStyle,
  } = props;

  const theme = useTheme();

  const { activeMethod, switchMethod, availableMethods, activeTransit } =
    useVerifyIdentity({
      transitData,
      initialMethod,
      customMethods,
      setShouldRestrict,
    });

  const steps = useMemo<IStep<VerifyIdentityMethod>[]>(() => {
    const list: IStep<VerifyIdentityMethod>[] = [];

    if (availableMethods.includes("TOTP")) {
      list.push({
        name: "TOTP",
        element: (
          <TotpView
            activeTransit={activeTransit}
            onSuccess={onSuccess}
            onSwitchMethod={switchMethod}
            availableMethods={availableMethods}
            onRateLimitExceeded={onRateLimitExceeded}
            isBotChallengeAllowed={isBotChallengeAllowed}
          />
        ),
      });
    }

    if (availableMethods.includes("MESSAGING")) {
      list.push({
        name: "MESSAGING",
        element: (
          <MessagingOtpView
            activeTransit={activeTransit}
            onSuccess={onSuccess}
            onSwitchMethod={switchMethod}
            availableMethods={availableMethods}
            onRateLimitExceeded={onRateLimitExceeded}
            isBotChallengeAllowed={isBotChallengeAllowed}
          />
        ),
      });
    }

    return list;
  }, [
    availableMethods,
    activeTransit,
    onSuccess,
    switchMethod,
    onRateLimitExceeded,
    isBotChallengeAllowed,
  ]);

  return (
    <Stack
      sx={{
        width: "36%",
        minWidth: 300,
        maxWidth: 600,
        [theme.breakpoints.down("lg")]: { width: "50%" },
        [theme.breakpoints.down("sm")]: {
          width: "100%",
          minWidth: "unset",
          maxWidth: "unset",
        },
        alignItems: "center",
        ...containerStyle,
      }}
    >
      <Stepper
        steps={steps}
        currStep={activeMethod}
        setCurrStep={(step) => switchMethod(step as VerifyIdentityMethod)}
      />
    </Stack>
  );
};
