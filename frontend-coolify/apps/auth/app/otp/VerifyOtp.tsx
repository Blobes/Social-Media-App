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
  OtpMessageChannel,
  TransitPurpose,
  useGlobalStore,
} from "@repo/core";
import { Logout } from "@repo/features";
import { useMisc } from "@repo/shared-hooks";

/**
 * All available messaging channels.
 */
const ALL_CHANNELS: OtpMessageChannel[] = ["EMAIL", "WHATSAPP", "SMS"];

/**
 * Formats channel enum key into reader-friendly label text.
 */
const getChannelLabel = (ch: OtpMessageChannel): string => {
  switch (ch) {
    case "EMAIL":
      return "Email";
    case "WHATSAPP":
      return "WhatsApp";
    case "SMS":
      return "SMS";
    default:
      return ch;
  }
};

/**
 * Renders the OTP verification interface and supports switching between channels.
 */
export const VerifyOtp = <P extends TransitPurpose>({
  transitData,
  setShouldRestrict,
  onRateLimitExceeded,
  isBotChallengeAllowed,
}: OtpOptions<P>) => {
  const theme = useTheme();
  const authStatus = useGlobalStore((state) => state.authStatus);
  const { isDesktop } = useMisc();

  const {
    code,
    setCode,
    timer,
    isVerifying,
    handleVerify,
    handleSendOtp,
    generatorMethod,
    msgChannel,
    switchChannel,
    switchToAuthenticator,
    hasTotpConfigured,
    recipient,
    inlineMsg,
    isSending,
  } = useOtp({
    transitData,
    setShouldRestrict,
    onRateLimitExceeded,
    isBotChallengeAllowed,
  });

  const isAuthenticator = generatorMethod === "AUTHENTICATOR_APP";

  // Resolves display label for the active destination.
  const channelText =
    recipient ||
    (msgChannel === "EMAIL"
      ? "your Email address"
      : msgChannel === "WHATSAPP"
        ? "your WhatsApp account"
        : "your Phone number");

  // Returns alternative message channels relative to the active channel.
  const alternativeChannels = ALL_CHANNELS.filter((ch) => ch !== msgChannel);

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
      }}
    >
      <Stack
        spacing={theme.gap(2)}
        sx={{ textAlign: "center", alignItems: "center" }}
      >
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
            : AUTH_FEEDBACK.verify_via_credential(getChannelLabel(msgChannel)))}
          sx={{ ...theme.typography.h5, fontWeight: 500, textAlign: "center" }}
        />
        <TransText
          {...(isAuthenticator
            ? AUTH_FEEDBACK.verify_code_from_auth_app_tagline
            : AUTH_FEEDBACK.otp_code_sent(channelText))}
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
        {!isAuthenticator ? (
          <>
            <Stack
              sx={{
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 0,
              }}
            >
              <TransText
                {...AUTH_FEEDBACK.otp_didnt_receive_code}
                sx={{ ...theme.typography.text3, width: "fit-content" }}
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
                options={{ disabled: timer > 0 }}
              >
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
                flexWrap: "wrap",
                [theme.breakpoints.down("sm")]: {
                  flexDirection: "column",
                },
              }}
            >
              {alternativeChannels.map((targetChannel, idx) => (
                <React.Fragment key={targetChannel}>
                  {idx > 0 && isDesktop && (
                    <Divider
                      orientation="vertical"
                      sx={{
                        height: "14px",
                        width: "unset",
                      }}
                    />
                  )}
                  <AppButton
                    variant="text"
                    size="small"
                    onClick={() => switchChannel(targetChannel)}
                    options={{ disabled: timer > 0 }}
                    style={{
                      color: theme.palette.primary.dark,
                    }}
                  >
                    {isSending ? (
                      <ProgressIcon options={{ size: 14 }} />
                    ) : (
                      <TransText
                        {...AUTH_BUTTON_LABELS.otp_switch_channel(
                          targetChannel.toLowerCase(),
                        )}
                        noComponent
                      />
                    )}
                  </AppButton>
                </React.Fragment>
              ))}

              {isDesktop && (
                <Divider
                  orientation="vertical"
                  sx={{
                    height: "14px",
                    width: "unset",
                  }}
                />
              )}

              <AppButton
                variant="text"
                size="small"
                onClick={switchToAuthenticator}
                options={{ disabled: !hasTotpConfigured }}
                style={{
                  color: theme.palette.primary.dark,
                }}
              >
                <TransText
                  {...AUTH_BUTTON_LABELS.use_authenticator}
                  noComponent
                />
              </AppButton>
            </Stack>
          </>
        ) : (
          <AppButton
            variant="text"
            size="small"
            onClick={() => switchChannel("EMAIL")}
            options={{ disabled: timer > 0 }}
            style={{
              color: theme.palette.primary.dark,
            }}
          >
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
                ...theme.typography.text3,
                width: "fit-content",
                fontWeight: 600,
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
