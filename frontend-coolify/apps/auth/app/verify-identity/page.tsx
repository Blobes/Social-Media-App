"use client";

import React, { useState, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import {
  useBotVerification,
  useCachedData,
  useStaticTranslation,
} from "@repo/shared-hooks";
import {
  AUTH_FEEDBACK,
  COMMON_BUTTON_LABELS,
  IStep,
  OtpStepName,
  OtpTransitData,
  TransitPurpose,
} from "@repo/core";
import {
  DisplayFeedbackUI,
  ProgressIcon,
  Stepper,
  BotVerification,
} from "@repo/shared-ui";
import { useLogout, VerifyIdentity } from "@repo/features";

/**
 * Manages two-factor/OTP verification workflow, protected by bot challenge verification steps.
 */
export default function OtpPage() {
  const theme = useTheme();
  const cachedEntries = useCachedData<OtpTransitData<TransitPurpose>>([
    "transit_data",
  ]);
  const { translateTxtString } = useStaticTranslation();
  const { handleLogout } = useLogout();

  const [shouldRestrict, setShouldRestrict] = useState<boolean>(false);
  const [currStep, setCurrStep] = useState<OtpStepName>("BOT_CHALLENGE");

  const { isCheckingSession, triggerBotChallenge, isBotChallengeAllowed } =
    useBotVerification({
      currStep,
      setCurrStep,
    });

  const steps = useMemo<IStep<OtpStepName>[]>(
    () => [
      {
        name: "BOT_CHALLENGE",
        element: (
          <BotVerification currStep={currStep} setCurrStep={setCurrStep} />
        ),
      },
      {
        name: "VERIFY_IDENTITY",
        element: (
          <VerifyIdentity
            transitData={cachedEntries}
            setShouldRestrict={setShouldRestrict}
            onRateLimitExceeded={triggerBotChallenge}
            isBotChallengeAllowed={isBotChallengeAllowed}
          />
        ),
      },
    ],
    [
      currStep,
      setCurrStep,
      cachedEntries,
      setShouldRestrict,
      triggerBotChallenge,
      isBotChallengeAllowed,
    ],
  );

  if (isCheckingSession) {
    return (
      <Stack
        sx={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ProgressIcon options={{ size: 32 }} />
      </Stack>
    );
  }

  return (
    <Stack
      sx={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.boxSpacing(20, 10),
        minHeight: "fit-content",
      }}
    >
      {(cachedEntries && cachedEntries.length > 0) || !shouldRestrict ? (
        <Stepper steps={steps} currStep={currStep} setCurrStep={setCurrStep} />
      ) : (
        <DisplayFeedbackUI
          type="UNAUTHORIZED"
          headline={translateTxtString(
            AUTH_FEEDBACK.no_verification_sesion_found,
          )}
          tagline={translateTxtString(AUTH_FEEDBACK.return_home)}
          primaryCta={{
            label: translateTxtString(COMMON_BUTTON_LABELS.go_home),
            action: handleLogout,
          }}
        />
      )}
    </Stack>
  );
}
