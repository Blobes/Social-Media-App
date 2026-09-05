"use client";

import React from "react";
import { Stack, Box, Divider } from "@mui/material";
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

/**
 * Renders the initial enrollment and configuration flow for Time-based One-Time Passwords (TOTP).
 * Generates a QR code or manual key, takes verification input, and handles fallback navigation modes.
 */
export const ConfigureTotp = <P extends TransitPurpose>(
  props: BaseVerificationProps<P>,
) => {
  const { onSwitchMethod, availableMethods, style } = props;
  const theme = useTheme();
  const authStatus = useGlobalStore((state) => state.authStatus);

  const {
    code,
    setCode,
    isVerifying,
    handleVerify,
    inlineMsg,
    setupData,
    isLoadingSetup,
    handleCopyKey,
    copied,
  } = useTotp({ ...props, viewMode: "CONFIGURE_TOTP" });

  const supportsMessagingFallback = availableMethods?.includes("MESSAGING");

  return (
    <Stack
      sx={{
        gap: theme.gap(16),
        width: "100%",
        alignItems: "center",
        ...style,
      }}
    >
      {/* Visual Branding & Instruction Section */}
      <Stack
        sx={{ gap: theme.gap(2), textAlign: "center", alignItems: "center" }}
      >
        <SVGWrapper
          src={asset.authenticator}
          size={80}
          fallbackUIType="SKELETON"
          sx={{
            marginBottom: theme.boxSpacing(4),
            flex: "none",
            alignSelf: "center",
          }}
        />
        <TransText
          {...AUTH_FEEDBACK.setup_authenticator_headline}
          sx={{ ...theme.typography.h5, fontWeight: 500, textAlign: "center" }}
        />
        <TransText
          {...AUTH_FEEDBACK.setup_authenticator_tagline}
          style={{
            ...theme.typography.text3,
            color: theme.palette.gray[200],
            textAlign: "center",
          }}
        />
      </Stack>

      {/* Secret Exchange Presentation (QR Code & Manual Setup Key) */}
      <Stack
        sx={{
          gap: theme.gap(12),
          alignItems: "center",
          width: "100%",
        }}
      >
        {isLoadingSetup ? (
          <Box sx={{ padding: theme.boxSpacing(12) }}>
            <ProgressIcon options={{ size: 32 }} />
          </Box>
        ) : (
          <>
            {/* Render scanned QR Code canvas once backend payload is fetched */}
            {setupData?.qrCodeDataUrl && (
              <Box
                component="img"
                src={setupData.qrCodeDataUrl}
                alt="Authenticator QR Code"
                sx={{
                  width: 160,
                  height: 160,
                  borderRadius: theme.radius[2],
                  border: `1px solid ${theme.palette.gray[100]}`,
                  padding: theme.boxSpacing(4),
                }}
              />
            )}

            {/* Fallback entry option for manual key entry */}
            {setupData?.manualEntryKey && (
              <Stack
                sx={{
                  alignItems: "center",
                  gap: theme.gap(2),
                  width: "100%",
                }}
              >
                <TransText
                  {...AUTH_FEEDBACK.enter_code_manually}
                  style={{
                    ...theme.typography.text3,
                    color: theme.palette.gray[200],
                    textAlign: "center",
                  }}
                />
                <AppButton
                  variant="text"
                  size="small"
                  onClick={handleCopyKey}
                  style={{ color: theme.palette.primary.dark }}
                >
                  {copied ? "Copied!" : setupData.manualEntryKey}
                </AppButton>
              </Stack>
            )}
          </>
        )}
      </Stack>

      {/* Interactive Verification Input Block */}
      <Stack
        sx={{
          width: "80%",
          [theme.breakpoints.down("lg")]: { width: "100%" },
          gap: theme.gap(16),
          alignItems: "center",
        }}
      >
        {/* Render runtime error response messages */}
        {!isVerifying && inlineMsg && (
          <InlineMsgUI msg={inlineMsg} type="ERROR" />
        )}

        <OtpInput
          length={6}
          onComplete={handleVerify}
          onChange={setCode}
          disabled={isVerifying || isLoadingSetup}
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

      {/* Auxiliary Action Handlers (Fallback methods & Active session exit) */}
      <Stack
        sx={{
          width: "100%",
          gap: theme.gap(10),
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Switch to alternative MFA delivery option if supported by payload */}
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

        {/* Allow authenticated user session destruction directly within setup interface */}
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
