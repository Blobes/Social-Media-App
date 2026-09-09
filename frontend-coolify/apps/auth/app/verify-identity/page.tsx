"use client";

import React, { useState, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { IconButton, Stack } from "@mui/material";
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
  STORAGE_KEYS,
  TransitPurpose,
} from "@repo/core";
import {
  DisplayFeedbackUI,
  ProgressIcon,
  Stepper,
  BotVerification,
  AppLogo,
  BasicTooltip,
} from "@repo/shared-ui";
import { useLogout, usePopup, VerifyIdentity } from "@repo/features";
import { ArrowLeft } from "lucide-react";
import { VerifyIdentityPreview } from "./Preview";

/**
 * Manages two-factor/OTP verification workflow, protected by bot challenge verification steps.
 */
export default function VerificationPage() {
  const theme = useTheme();
  const transitEntries = useCachedData<OtpTransitData<TransitPurpose>>(
    STORAGE_KEYS.TRANSIT_DATA,
  );
  const { translateTxtString } = useStaticTranslation();
  const { handleLogout } = useLogout();
  const { openPopup } = usePopup();

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
          // <VerifyIdentity
          //   transitData={transitEntries}
          //   setShouldRestrict={setShouldRestrict}
          //   onRateLimitExceeded={triggerBotChallenge}
          //   isBotChallengeAllowed={isBotChallengeAllowed}
          // />
          <VerifyIdentityPreview />
        ),
      },
    ],
    [
      currStep,
      setCurrStep,
      transitEntries,
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
      {(transitEntries && transitEntries.length > 0) || !shouldRestrict ? (
        <>
          {/* App Logo & Back Button */}
          <Stack
            sx={{
              flexDirection: "row",
              gap: theme.gap(8),
              position: "absolute",
              top: 20,
              left: 30,
            }}
          >
            <BasicTooltip
              title={translateTxtString(
                AUTH_FEEDBACK.terminate_session_back_to_login,
              )}
            >
              <IconButton
                aria-label="Open modal window context"
                aria-controls="open-modal"
                aria-haspopup="false"
                sx={{
                  width: 40,
                  height: 40,
                  padding: theme.boxSpacing(4, 4),
                  color: theme.palette.gray[300],
                  flex: "none",
                }}
                onClick={() => {
                  openPopup("CONFIRM_SESSION_TERMINATION");
                }}
              >
                <ArrowLeft size={28} stroke={theme.palette.gray[300]} />
              </IconButton>
            </BasicTooltip>
            <AppLogo />
          </Stack>

          {/* Verification UI View */}
          <Stepper
            steps={steps}
            currStep={currStep}
            setCurrStep={setCurrStep}
          />
        </>
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
