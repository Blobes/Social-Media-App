"use client";

import React from "react";
import { IconButton, Stack, Typography } from "@mui/material";
import {
  AppButton,
  PasswordInput,
  InlineMsg,
  BasicTooltip,
  ProgressIcon,
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { Pencil } from "lucide-react";
import { useLogin } from "./hooks/useLogin";
import { GenericStyle } from "@repo/core";
import { StepName } from "../types";

interface StepProps {
  credential: string;
  step?: StepName;
  setStep?: (step: StepName) => void;
  redirectTo?: string;
  style?: {
    headline?: GenericStyle;
    tagline?: GenericStyle;
  };
}

export const PasswordStep: React.FC<StepProps> = ({
  credential,
  setStep,
  style = {},
}) => {
  const theme = useTheme();

  // Consuming the controller
  const {
    password,
    passwordValidity,
    errorMsg,
    onPasswordChange,
    handleSubmit,
    isAuthLoading,
    inlineMsg,
    isLocked,
  } = useLogin({ credential, setStep });

  return (
    <>
      <Stack>
        <Typography
          component="h4"
          variant="h5"
          sx={{ textAlign: "center", ...style.headline }}>
          Welcome back buzzer!
        </Typography>
        <Typography
          component="p"
          variant="body2"
          sx={{
            color: theme.palette.gray[200],
            paddingBottom: theme.boxSpacing(8),
            textAlign: "center",
            ...style.tagline,
          }}>
          Enter your password to login.
        </Typography>
      </Stack>

      {!isAuthLoading && inlineMsg && (
        <InlineMsg msg={inlineMsg} type="ERROR" />
      )}

      <Stack
        sx={{ gap: theme.gap(18) }}
        component="form"
        onSubmit={handleSubmit}>
        <Stack gap={theme.gap(8)}>
          <Stack direction="row">
            <Typography
              component="p"
              variant="body2"
              sx={{
                textAlign: "left",
                padding: theme.boxSpacing(6, 8),
                borderRadius: theme.radius[3],
                color: theme.palette.primary.dark,
                border: `1px solid ${theme.fixedColors.pTrans}`,
                backgroundColor: theme.fixedColors.pTrans,
                width: "100%",
                fontWeight: "500",
                fontSize: "16px",
              }}>
              {credential}
            </Typography>
            <BasicTooltip title={"Change credential"}>
              <IconButton
                sx={{
                  padding: theme.boxSpacing(3, 4),
                  color: theme.palette.gray[200],
                  border: `1px solid ${theme.palette.gray.trans[1]}`,
                  borderRadius: theme.radius[3],
                  width: "48px",
                  backgroundColor: theme.fixedColors.pTrans,
                }}
                onClick={() => setStep?.("CREDENTIAL")}>
                <Pencil
                  style={{ width: "20px", stroke: theme.palette.gray[200] }}
                />
              </IconButton>
            </BasicTooltip>
          </Stack>
          <PasswordInput
            label="Password"
            placeholder="Password"
            onChange={onPasswordChange}
            helperText={errorMsg}
            error={password === "" && passwordValidity === "INVALID"}
          />
        </Stack>

        <AppButton
          variant="contained"
          submit
          style={{
            fontSize: "16px",
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
          {isAuthLoading ? <ProgressIcon otherProps={{ size: 25 }} /> : "Login"}
        </AppButton>
      </Stack>
    </>
  );
};
