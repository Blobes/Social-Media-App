"use client";

import React from "react";
import { Stack } from "@mui/material";
import {
  AppButton,
  PasswordInput,
  InlineMsgUI,
  ProgressIcon,
  TransText,
  UIGuide,
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { AUTH_INPUT, AUTH_BUTTON_LABELS, AUTH_FEEDBACK } from "@repo/core";
import { useStaticTranslation, useGuides } from "@repo/shared-hooks";
import { useReset } from "./useReset";
import { ResetStepProps } from "../../types";

/**
 * Secure step component enforcing dynamic mutation updates inside authorized timeframes.
 */
export const NewPasswordStep: React.FC<ResetStepProps> = ({
  step,
  setStep,
  style = {},
}) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();
  const { INPUT_GUIDES } = useGuides();

  const {
    password,
    passwordVisualStates,
    isPasswordValid,
    confirmPassword,
    confirmPassErrMsg,
    handlePasswordChange,
    handleConfirmChange,
    isAuthLoading,
    inlineMsg,
    timeLeft,
    isNewPasswordSubmitDisabled,
    handleNewPasswordSubmit,
  } = useReset({ step, setStep });

  return (
    <Stack sx={{ width: "100%" }}>
      <Stack>
        <TransText
          {...AUTH_FEEDBACK.set_new_password_headline}
          component="h3"
          sx={{
            ...theme.typography.h5,
            textAlign: "center",
            ...style.headline,
          }}
        />
        <Stack
          direction="row"
          justifyContent="center"
          gap={1}
          sx={{ paddingBottom: theme.boxSpacing(8) }}>
          <TransText
            {...AUTH_FEEDBACK.set_new_password_tagline}
            component="p"
            sx={{ ...theme.typography.text3, color: theme.palette.gray[200] }}
          />
          <span
            style={{
              ...theme.typography.text3,
              color: theme.palette.error.main,
              fontWeight: 700,
            }}>
            {Math.floor(timeLeft / 60)}:
            {(timeLeft % 60).toString().padStart(2, "0")}
          </span>
        </Stack>
      </Stack>

      {inlineMsg && <InlineMsgUI msg={inlineMsg} type="ERROR" />}

      <Stack
        sx={{ gap: theme.gap(18) }}
        component="form"
        onSubmit={handleNewPasswordSubmit}>
        <PasswordInput
          label={translateTxtString(AUTH_INPUT.label.password)}
          placeholder={translateTxtString(
            AUTH_INPUT.placeholder.create_password,
          )}
          onChange={handlePasswordChange}
          value={password}
          error={password !== "" && !isPasswordValid}
          inputGuideUI={
            <UIGuide
              guides={[INPUT_GUIDES.PASSWORD]}
              showTitle={false}
              detailVisuals={passwordVisualStates}
              containerStyle={{
                backgroundColor: theme.palette.gray.trans[1],
                borderRadius: theme.radius[2],
              }}
            />
          }
        />

        <PasswordInput
          label={translateTxtString(AUTH_INPUT.label.confirm_password)}
          placeholder={translateTxtString(
            AUTH_INPUT.placeholder.re_enter_password,
          )}
          onChange={handleConfirmChange}
          helperText={confirmPassErrMsg}
          value={confirmPassword}
          error={confirmPassword !== "" && password !== confirmPassword}
        />

        <AppButton
          variant="contained"
          submit
          style={{
            ...theme.typography.text3,
            padding: theme.boxSpacing(6, 9),
            width: "100%",
          }}
          options={{
            disabled: isNewPasswordSubmitDisabled,
          }}>
          {isAuthLoading ? (
            <ProgressIcon otherProps={{ size: 25 }} />
          ) : (
            <TransText {...AUTH_BUTTON_LABELS.reset_password} noComponent />
          )}
        </AppButton>
      </Stack>
    </Stack>
  );
};
