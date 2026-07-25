"use client";

import React from "react";
import { Divider, IconButton, Stack } from "@mui/material";
import {
  AppButton,
  PasswordInput,
  InlineMsgUI,
  BasicTooltip,
  ProgressIcon,
  TransText,
  AnchorLink,
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { Lock, Pencil } from "lucide-react";
import { useLogin } from "./hooks/useLogin";
import { LoginStepProps } from "../types";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  AUTH_INPUT,
  CLIENT_ROUTES,
  COMMON_BUTTON_LABELS,
  COMMON_FEEDBACK,
} from "@repo/core";
import { useStaticTranslation } from "@repo/shared-hooks";
import { useIdentifier } from "./hooks/useIdentifier";
import { DisplayFeedbackUI } from "@repo/features";

interface StepProps extends LoginStepProps {
  credential: string;
}

export const PasswordStep: React.FC<StepProps> = ({
  credential: identifier,
  setStep,
  style = {},
}) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();
  const { handleResetPassClick } = useIdentifier({});

  // Consuming the controller
  const {
    password,
    passwordValidity,
    errorMsg,
    onPasswordChange,
    handleSubmit,
    isAuthLoading,
    inlineMsg,
    inlineMsgStyle,
    setInlineMsg,
    isLocked,
    MAX_ATTEMPTS,
    LOCKOUT_MIN,
    formattedSec,
  } = useLogin({ identifier, setStep });

  return !isLocked ? (
    <Stack
      sx={{
        width: "90%",
        gap: theme.gap(8),
        [theme.breakpoints.down("md")]: {
          width: "100%",
        },
      }}>
      <Lock size={40} style={{ alignSelf: "center" }} />
      {/* Headline & Tagline */}
      <Stack sx={{}}>
        <TransText
          {...COMMON_FEEDBACK.welcome_back()}
          component="h3"
          sx={{
            ...theme.typography.h6,
            textAlign: "center",
            ...style.headline,
          }}
        />
        <TransText
          {...AUTH_FEEDBACK.enter_password_to_login(MAX_ATTEMPTS, LOCKOUT_MIN)}
          sx={{
            ...theme.typography.text4,
            color: theme.palette.gray[200],
            paddingBottom: theme.boxSpacing(8),
            textAlign: "center",
            ...style.tagline,
          }}
        />
      </Stack>

      {/* Feedback UI */}
      {!isAuthLoading && inlineMsg && (
        <InlineMsgUI msg={inlineMsg} type="ERROR" />
      )}

      {/* Form */}
      <Stack
        sx={{
          gap: theme.gap(24),
        }}
        component="form"
        onSubmit={handleSubmit}>
        <Stack sx={{ gap: theme.gap(8) }}>
          {/* User Identifier Snapshot */}
          <Stack direction="row" gap={theme.gap(2)}>
            <TransText
              component="p"
              sx={{
                ...theme.typography.text4,
                textAlign: "left",
                padding: theme.boxSpacing(4, 6),
                borderRadius: theme.radius[3],
                color: theme.palette.primary.dark,
                backgroundColor: theme.fixedColors.pTrans,
                width: "100%",
                fontWeight: "500",
              }}>
              {identifier}
            </TransText>
            <BasicTooltip
              title={translateTxtString(AUTH_BUTTON_LABELS.change_credential)}>
              <IconButton
                sx={{
                  padding: theme.boxSpacing(4, 4),
                  color: theme.palette.gray[300],
                  borderRadius: theme.radius[3],
                  width: "44px",
                  backgroundColor: theme.fixedColors.pTrans,
                }}
                onClick={() => {
                  setInlineMsg(null);
                  setStep?.("IDENTIFIER");
                }}>
                <Pencil
                  style={{ width: "18px", stroke: theme.palette.gray[300] }}
                />
              </IconButton>
            </BasicTooltip>
          </Stack>
          {/* Password Input Field */}
          <PasswordInput
            label={translateTxtString(AUTH_INPUT.label.password)}
            placeholder={translateTxtString(
              AUTH_INPUT.placeholder.enter_password,
            )}
            onChange={onPasswordChange}
            helperText={errorMsg}
            value={password}
            error={password === "" && passwordValidity === "INVALID"}
          />
        </Stack>

        <Stack sx={{ gap: theme.gap(12) }}>
          {/* Submit CTA */}
          <AppButton
            variant="contained"
            submit
            style={{
              width: "100%",
            }}
            options={{
              disabled:
                passwordValidity === "INVALID" ||
                password === "" ||
                isLocked ||
                isAuthLoading,
            }}>
            {isAuthLoading ? (
              <ProgressIcon otherProps={{ size: 25 }} />
            ) : (
              <TransText {...AUTH_BUTTON_LABELS.login} noComponent />
            )}
          </AppButton>
          {/* Password Reset CTA */}
          <AnchorLink
            href={CLIENT_ROUTES.resetPassword.path}
            onClick={handleResetPassClick}
            style={{
              color: theme.palette.primary.main,
              flex: "none",
              alignSelf: "center",
              "&:hover": {
                textAlign: "center",
                color: theme.palette.primary.dark,
                textDecoration: "underline",
                fontWeight: 600,
              },
            }}>
            <TransText {...COMMON_BUTTON_LABELS.reset_password} noComponent />
          </AnchorLink>
        </Stack>
      </Stack>
    </Stack>
  ) : (
    <DisplayFeedbackUI
      type="UNAUTHORIZED"
      headline={translateTxtString(AUTH_FEEDBACK.password_locked_headline)}
      tagline={
        <TransText
          noComponent
          {...AUTH_FEEDBACK.password_locked_tagline(formattedSec)}
          inlineComponents={{ timer: <strong style={inlineMsgStyle} /> }}
        />
      }
      primaryCta={{
        label: translateTxtString(AUTH_BUTTON_LABELS.reset_password),
        action: () => handleResetPassClick,
      }}
      secondaryCta={{
        label: translateTxtString(COMMON_BUTTON_LABELS.back),
        action: () => setStep?.("IDENTIFIER"),
      }}
    />
  );
};
