"use client";

import React from "react";
import { Divider, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AppButton,
  InlineMsgUI,
  OtpInput,
  ProgressIcon,
  TransText,
} from "@repo/shared-ui";
import { OtpOptions, useOtp } from "./useOtp";
import { ShieldCheckIcon, SquareAsterisk } from "lucide-react";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  OtpTransitData,
  TransitPurpose,
  useGlobalStore,
} from "@repo/core";
import { Logout } from "@repo/features";

export const VerifyOtp = <P extends TransitPurpose>({
  transitData,
  setShouldRestrict,
}: OtpOptions<P>) => {
  const theme = useTheme();
  const authStatus = useGlobalStore((state) => state.authStatus);

  const {
    code,
    setCode,
    timer,
    isVerifying,
    handleVerify,
    handleSendOtp,
    channel,
    switchChannel,
    switchToAuthenticator,
    recipient,
    inlineMsg,
    isSending,
  } = useOtp({ transitData, setShouldRestrict });

  const isEmail = channel === "EMAIL";
  const isAuthenticator = channel === "AUTHENTICATOR";

  const targetDestination =
    recipient || (isEmail ? "your Email address" : "your Phone number");

  return (
    <Stack
      sx={{
        gap: theme.gap(20),
        width: "30%",
        minWidth: 300,
        maxWidth: 600,
        [theme.breakpoints.down("sm")]: {
          width: "100%",
          minWidth: "unset",
          maxWidth: "unset",
        },
        alignItems: "center",
      }}>
      <Stack
        spacing={theme.gap(2)}
        sx={{ textAlign: "center", alignItems: "center" }}>
        {isAuthenticator ? (
          <ShieldCheckIcon
            size={60}
            strokeWidth="1.5px"
            style={{ stroke: theme.palette.primary.main }}
          />
        ) : (
          <SquareAsterisk
            size={60}
            strokeWidth="1.5px"
            style={{ stroke: theme.palette.primary.main }}
          />
        )}

        <TransText
          {...(isAuthenticator
            ? AUTH_FEEDBACK.verify_code_from_auth_app_headline
            : AUTH_FEEDBACK.verify_via_credential(isEmail ? "Email" : "Phone"))}
          sx={{ ...theme.typography.h5, fontWeight: 500, textAlign: "center" }}
        />
        <TransText
          {...(isAuthenticator
            ? AUTH_FEEDBACK.verify_code_from_auth_app_tagline
            : AUTH_FEEDBACK.otp_code_sent(targetDestination))}
          style={{
            ...theme.typography.text3,
            color: theme.palette.gray[200],
            textAlign: "center",
          }}
        />
      </Stack>

      {/* OTP Field and CTA */}
      <Stack
        sx={{
          width: "80%",
          [theme.breakpoints.down("lg")]: { width: "100%" },
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
          style={{ width: "100%" }}
          options={{ disabled: code.length < 6 || isVerifying }}>
          {isVerifying ? (
            <ProgressIcon options={{ size: 24 }} />
          ) : (
            <TransText {...AUTH_BUTTON_LABELS.otp_verify_code} noComponent />
          )}
        </AppButton>
      </Stack>

      {/* Footer */}
      <Stack
        sx={{
          width: "100%",
          gap: theme.gap(10),
          flexDirection: "column",
          alignItems: "center",
        }}>
        {!isAuthenticator ? (
          <>
            <Stack direction="row" alignItems="center" gap={0}>
              <TransText
                {...AUTH_FEEDBACK.otp_didnt_receive_code}
                sx={{ ...theme.typography.text3 }}
              />
              <AppButton
                variant="text"
                size="small"
                onClick={() => handleSendOtp()}
                style={{
                  color: theme.palette.primary.dark,
                  paddingX: theme.boxSpacing(6),
                  "&:disabled": {
                    color: theme.palette.primary.dark,
                  },
                }}
                options={{ disabled: timer > 0 }}>
                {isSending ? (
                  <ProgressIcon options={{ size: 14 }} />
                ) : (
                  <TransText
                    {...(timer > 0
                      ? AUTH_BUTTON_LABELS.otp_resend_code_in_seconds(timer)
                      : AUTH_BUTTON_LABELS.otp_resend_code_now)}
                    noComponent
                  />
                )}
              </AppButton>
            </Stack>
            <Stack
              sx={{
                width: "100%",
                flexDirection: "row",
                gap: theme.gap(1),
                alignItems: "center",
                justifyContent: "center",
              }}>
              <AppButton
                variant="text"
                size="small"
                onClick={() => switchChannel(isEmail ? "PHONE" : "EMAIL")}
                options={{ disabled: timer > 0 }}
                style={{
                  color: theme.palette.primary.dark,
                }}>
                {isSending ? (
                  <ProgressIcon options={{ size: 14 }} />
                ) : (
                  <TransText
                    {...AUTH_BUTTON_LABELS.otp_switch_channel(
                      isEmail ? "SMS" : "email",
                    )}
                    noComponent
                  />
                )}
              </AppButton>

              <Divider
                orientation="vertical"
                sx={{
                  height: "14px",
                  width: "unset",
                }}
              />

              <AppButton
                variant="text"
                size="small"
                onClick={switchToAuthenticator}
                style={{
                  color: theme.palette.primary.dark,
                }}>
                <TransText
                  {...AUTH_BUTTON_LABELS.use_authenticator}
                  noComponent
                />
              </AppButton>
            </Stack>
          </>
        ) : (
          // Only show switch option if the other channel exists on the user profile
          <AppButton
            variant="text"
            size="small"
            onClick={() => switchChannel(isEmail ? "PHONE" : "EMAIL")}
            options={{ disabled: timer > 0 }}
            style={{
              color: theme.palette.primary.dark,
            }}>
            {isSending ? (
              <ProgressIcon options={{ size: 14 }} />
            ) : (
              <TransText
                {...AUTH_BUTTON_LABELS.verify_with_email_phone}
                noComponent
              />
            )}
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
                width: "fit-content",
                textAlign: "center",
                color: theme.palette.gray[200],
              }}
              iconStyle={{
                size: 18,
              }}
            />
          </>
        )}
      </Stack>
    </Stack>
  );
};
