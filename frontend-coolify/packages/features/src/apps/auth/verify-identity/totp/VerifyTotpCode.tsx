"use client";

import React from "react";
import { Stack, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AppButton,
  InlineMsgUI,
  OtpInput,
  ProgressIcon,
  SVGWrapper,
  TransText,
} from "@repo/shared-ui";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  TransitPurpose,
  useGlobalStore,
} from "@repo/core";

import { asset } from "@repo/assets";
import { useTotp } from "./useTotp";
import { BaseVerificationProps } from "../useVerifyIdentity";
import { Logout } from "../../logout/Logout";

export const VerifyTotpCode = <P extends TransitPurpose>(
  props: BaseVerificationProps<P>,
) => {
  const { onSwitchMethod, availableMethods, style } = props;
  const theme = useTheme();
  const authStatus = useGlobalStore((state) => state.authStatus);

  const { code, setCode, isVerifying, handleVerify, inlineMsg } = useTotp({
    ...props,
    viewMode: "VERIFY_TOTP_CODE",
  });

  const supportsMessagingFallback = availableMethods?.includes("MESSAGING");

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

      <Stack
        sx={{
          width: "100%",
          gap: theme.gap(10),
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {supportsMessagingFallback && (
          <AppButton
            variant="text"
            size="small"
            onClick={() => onSwitchMethod?.("MESSAGING")}
            style={{ color: theme.palette.primary.dark }}
          >
            <TransText
              {...AUTH_BUTTON_LABELS.verify_with_email_phone}
              noComponent
            />
          </AppButton>
        )}

        {authStatus === "AUTHENTICATED" && (
          <>
            <Divider sx={{ width: "100%" }} />
            <Logout
              containerStyle={{
                gap: theme.gap(4),
                hover: {
                  "& svg": { stroke: theme.palette.primary.dark },
                },
              }}
              textStyle={{
                ...theme.typography.text3,
                width: "fit-content",
                fontWeight: 600,
                color: theme.palette.gray[200],
              }}
              iconStyle={{ size: 18 }}
            />
          </>
        )}
      </Stack>
    </Stack>
  );
};
