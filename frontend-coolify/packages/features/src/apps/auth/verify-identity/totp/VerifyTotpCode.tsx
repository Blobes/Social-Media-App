"use client";

import React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AppButton,
  InlineMsgUI,
  OtpInput,
  ProgressIcon,
  SVGWrapper,
  TransText,
} from "@repo/shared-ui";
import { AUTH_BUTTON_LABELS, AUTH_FEEDBACK, TransitPurpose } from "@repo/core";

import { asset } from "@repo/assets";
import { useTotp } from "./useTotp";
import { BaseVerificationProps } from "../useVerifyIdentity";

export const VerifyTotpCode = <P extends TransitPurpose>(
  props: BaseVerificationProps<P>,
) => {
  const { style } = props;
  const theme = useTheme();

  const { code, setCode, isVerifying, handleVerify, inlineMsg } = useTotp({
    ...props,
    viewMode: "VERIFY_TOTP_CODE",
  });

  return (
    <Stack
      sx={{
        gap: theme.gap(20),
        width: "100%",
        alignItems: "center",
        ...style,
      }}
    >
      <Stack
        sx={{ gap: theme.gap(2), textAlign: "center", alignItems: "center" }}
      >
        <SVGWrapper
          src={asset.authenticator}
          size={90}
          fallbackUIType="SKELETON"
          sx={{
            marginBottom: theme.boxSpacing(8),
            flex: "none",
            alignSelf: "center",
          }}
        />
        <TransText
          {...AUTH_FEEDBACK.verify_code_from_auth_app_headline}
          sx={{ ...theme.typography.h5, fontWeight: 500, textAlign: "center" }}
        />
        <TransText
          {...AUTH_FEEDBACK.verify_code_from_auth_app_tagline}
          style={{
            ...theme.typography.text3,
            color: theme.palette.gray[200],
            textAlign: "center",
          }}
        />
      </Stack>

      <Stack
        sx={{
          width: "80%",
          [theme.breakpoints.down("lg")]: { width: "100%" },
          gap: theme.gap(16),
          alignItems: "center",
        }}
      >
        {!isVerifying && inlineMsg && (
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
          style={{ width: "100%" }}
          options={{ disabled: code.length < 6 || isVerifying }}
        >
          {isVerifying ? (
            <ProgressIcon options={{ size: 24 }} />
          ) : (
            <TransText {...AUTH_BUTTON_LABELS.otp_verify_code} noComponent />
          )}
        </AppButton>
      </Stack>
    </Stack>
  );
};
