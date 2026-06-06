"use client";

import React from "react";
import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AppButton,
  InlineMsgUI,
  OtpInput,
  ProgressIcon,
} from "@repo/shared-ui";
import { useOtp } from "./useOtp";
import { SquareAsterisk } from "lucide-react";
import { OtpTransitData } from "@repo/core";

interface VerifyOtpProps {
  transitData: OtpTransitData[];
}

export const VerifyOtp = ({ transitData }: VerifyOtpProps) => {
  const theme = useTheme();

  const {
    code,
    setCode,
    timer,
    isVerifying,
    handleVerify,
    handleSendOtp,
    channel,
    switchChannel,
    recipient,
    inlineMsg,
    isSending,
  } = useOtp(transitData);

  const isEmail = channel === "EMAIL";

  return (
    <Stack
      sx={{
        gap: theme.gap(20),
        width: "100%",
        [theme.breakpoints.up("sm")]: { width: "60cqh" },
        alignItems: "center",
      }}>
      <Stack
        spacing={theme.gap(2)}
        sx={{ textAlign: "center", alignItems: "center" }}>
        <SquareAsterisk
          size={60}
          strokeWidth="1.5px"
          style={{ stroke: theme.palette.primary.main }}
        />
        <Typography variant="h5" fontWeight={500}>
          Verify your {isEmail ? "Email" : "Phone"}
        </Typography>
        <Typography variant="body2" color="gray.200">
          We sent a 6-digit code to <b>{recipient}</b>
        </Typography>
      </Stack>

      {/* OTP Field and CTA */}
      <Stack
        sx={{
          width: "100%",
          [theme.breakpoints.up("sm")]: { width: "48cqh" },
          gap: theme.gap(16),
          alignItems: "center",
        }}>
        {/* Feedback */}
        {(!isVerifying || !isSending) && inlineMsg && (
          <InlineMsgUI msg={inlineMsg} type="ERROR" />
        )}

        <OtpInput
          length={6}
          onComplete={handleVerify}
          onChange={setCode}
          disabled={isVerifying}
          style={{ input: { width: "100%" } }}
        />
        <AppButton
          variant="contained"
          onClick={() => handleVerify()}
          style={{ width: "100%", paddingY: theme.boxSpacing(4) }}
          options={{ disabled: code.length < 6 || isVerifying }}>
          {isVerifying ? (
            <ProgressIcon otherProps={{ size: 24 }} />
          ) : (
            "Verify code"
          )}
        </AppButton>
      </Stack>

      {/* Footer */}
      <Stack direction="column" alignItems="center" gap={theme.gap(10)}>
        <Stack direction="row" alignItems="center" gap={0}>
          <Typography variant="body2">Didn't receive a code?</Typography>
          <AppButton
            variant="text"
            onClick={() => handleSendOtp()}
            style={{
              color: theme.palette.primary.dark,
              "&:disabled": {
                color: theme.palette.primary.dark,
              },
            }}
            options={{ disabled: timer > 0 }}>
            {isSending ? (
              <ProgressIcon otherProps={{ size: 14 }} />
            ) : timer > 0 ? (
              `Resend in ${timer}s`
            ) : (
              "Resend Now"
            )}
          </AppButton>
        </Stack>

        {/* Only show switch option if the other channel exists on the user profile */}
        <AppButton
          variant="text"
          onClick={switchChannel}
          style={{
            color: theme.palette.primary.dark,
            padding: theme.boxSpacing(3, 6),
          }}>
          {isSending ? (
            <ProgressIcon otherProps={{ size: 14 }} />
          ) : (
            `Send code via ${isEmail ? "SMS" : "email"}`
          )}
        </AppButton>
      </Stack>
    </Stack>
  );
};
