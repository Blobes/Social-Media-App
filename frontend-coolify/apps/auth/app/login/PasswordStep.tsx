"use client";

import React from "react";
import { IconButton, Stack } from "@mui/material";
import {
  AppButton,
  PasswordInput,
  InlineMsgUI,
  BasicTooltip,
  ProgressIcon,
  TransText,
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { Pencil } from "lucide-react";
import { useLogin } from "./hooks/useLogin";
import { LoginStepProps } from "../types";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  AUTH_INPUT,
  COMMON_FEEDBACK,
} from "@repo/core";
import { useStaticTranslation } from "@repo/shared-hooks";

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

  // Consuming the controller
  const {
    password,
    passwordValidity,
    errorMsg,
    onPasswordChange,
    handleSubmit,
    isAuthLoading,
    inlineMsg,
    setInlineMsg,
    isLocked,
  } = useLogin({ identifier, setStep });

  return (
    <Stack sx={{ width: "100%" }}>
      <Stack>
        <TransText
          {...COMMON_FEEDBACK.welcome_back()}
          component="h3"
          sx={{
            ...theme.typography.h5,
            textAlign: "center",
            ...style.headline,
          }}
        />
        <TransText
          {...AUTH_FEEDBACK.enter_password_to_login}
          component="p"
          sx={{
            ...theme.typography.text3,
            color: theme.palette.gray[200],
            paddingBottom: theme.boxSpacing(8),
            textAlign: "center",
            ...style.tagline,
          }}
        />
      </Stack>

      {!isAuthLoading && inlineMsg && (
        <InlineMsgUI msg={inlineMsg} type="ERROR" />
      )}

      <Stack
        sx={{ gap: theme.gap(18) }}
        component="form"
        onSubmit={handleSubmit}>
        <Stack gap={theme.gap(8)}>
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

        <AppButton
          variant="contained"
          submit
          style={{
            ...theme.typography.text3,
            padding: theme.boxSpacing(6, 9),
            width: "100%",
          }}
          options={{
            disabled:
              passwordValidity === "INVALID" ||
              password === "" ||
              isLocked || // Now using the boolean from controller
              isAuthLoading,
          }}>
          {isAuthLoading ? (
            <ProgressIcon otherProps={{ size: 25 }} />
          ) : (
            <TransText {...AUTH_BUTTON_LABELS.login} noComponent />
          )}
        </AppButton>
      </Stack>
    </Stack>
  );
};
