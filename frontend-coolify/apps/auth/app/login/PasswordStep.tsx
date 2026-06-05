"use client";

import React from "react";
import { IconButton, Stack, Typography } from "@mui/material";
import {
  AppButton,
  PasswordInput,
  InlineMsgUI,
  BasicTooltip,
  ProgressIcon,
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { Pencil } from "lucide-react";
import { useLogin } from "./hooks/useLogin";
import { LoginStepProps } from "../types";
import { useGlobalStore } from "@repo/shared-hooks";

interface StepProps extends LoginStepProps {
  credential: string;
}

export const PasswordStep: React.FC<StepProps> = ({
  credential: identifier,
  setStep,
  style = {},
}) => {
  const theme = useTheme();
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);

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
  } = useLogin({ identifier, setStep });

  return (
    <Stack sx={{ width: "100%" }}>
      <Stack>
        <Typography
          component="h3"
          variant="h5"
          sx={{ textAlign: "center", ...style.headline }}>
          Welcome back
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
        <InlineMsgUI msg={inlineMsg} type="ERROR" />
      )}

      <Stack
        sx={{ gap: theme.gap(18) }}
        component="form"
        onSubmit={handleSubmit}>
        <Stack gap={theme.gap(8)}>
          <Stack direction="row" gap={theme.gap(2)}>
            <Typography
              component="p"
              variant="body3"
              sx={{
                textAlign: "left",
                padding: theme.boxSpacing(4, 6),
                borderRadius: theme.radius[3],
                color: theme.palette.primary.dark,
                backgroundColor: theme.fixedColors.pTrans,
                width: "100%",
                fontWeight: "500",
              }}>
              {identifier}
            </Typography>
            <BasicTooltip title={"Change credential"}>
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
            label="Password"
            placeholder="Password"
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
    </Stack>
  );
};
