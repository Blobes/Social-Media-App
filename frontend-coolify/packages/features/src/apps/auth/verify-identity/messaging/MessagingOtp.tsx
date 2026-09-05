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
  OtpMessageChannel,
  TransitPurpose,
  useGlobalStore,
} from "@repo/core";
import { useMisc } from "@repo/shared-hooks";
import { asset } from "@repo/assets";
import { useMessagingOtp } from "./useMessaging";
import { BaseVerificationProps } from "../useVerifyIdentity";
import { Logout } from "../../logout/Logout";

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

export const MessagingOtpView = <P extends TransitPurpose>(
  props: BaseVerificationProps<P>,
) => {
  const { onSwitchMethod, availableMethods, style } = props;
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
    msgChannel,
    switchChannel,
    recipient,
    inlineMsg,
    isSmsAllowed,
    isWhatsappActive,
    allowedChannels,
    isSending,
    isCheckingWhatsapp,
  } = useMessagingOtp(props);

  const channelText =
    recipient ||
    (msgChannel === "EMAIL"
      ? "your Email address"
      : msgChannel === "WHATSAPP"
        ? "your WhatsApp account"
        : "your Phone number");

  const alternativeChannels = allowedChannels.filter(
    (ch) =>
      ch !== msgChannel &&
      (ch !== "SMS" || isSmsAllowed) &&
      (ch !== "WHATSAPP" || isWhatsappActive),
  );

  const supportsTotpFallback = availableMethods?.includes("TOTP");
  const isBusy = isSending || isCheckingWhatsapp;

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
          src={asset.hashedStars}
          size={100}
          color={theme.palette.primary.dark}
          fallbackUIType="SKELETON"
          sx={{
            height: "unset",
            padding: theme.boxSpacing(8),
            marginBottom: theme.boxSpacing(8),
            background: theme.fixedColors.pTrans,
            borderRadius: theme.radius[3],
            flex: "none",
            alignSelf: "center",
          }}
        />

        <TransText
          {...AUTH_FEEDBACK.verify_via_credential(getChannelLabel(msgChannel))}
          sx={{ ...theme.typography.h5, fontWeight: 500, textAlign: "center" }}
        />
        <TransText
          {...AUTH_FEEDBACK.otp_code_sent(channelText)}
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
        {!isVerifying && !isBusy && inlineMsg && (
          <InlineMsgUI msg={inlineMsg} type="ERROR" />
        )}

        <OtpInput
          length={6}
          onComplete={handleVerify}
          onChange={setCode}
          disabled={isVerifying || isBusy}
          style={{ input: { width: "100%" } }}
        />
        <AppButton
          variant="contained"
          onClick={() => handleVerify()}
          style={{ width: "100%" }}
          options={{ disabled: code.length < 6 || isVerifying || isBusy }}
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
            options={{ disabled: timer > 0 || isBusy }}
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
                  sx={{ height: "14px", width: "unset" }}
                />
              )}
              <AppButton
                variant="text"
                size="small"
                onClick={() => switchChannel(targetChannel)}
                options={{
                  disabled: timer > 0 || isBusy,
                }}
                style={{ color: theme.palette.primary.dark }}
              >
                {isBusy ? (
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

          {supportsTotpFallback && (
            <>
              {(alternativeChannels.length > 0 || isDesktop) && (
                <Divider
                  orientation="vertical"
                  sx={{ height: "14px", width: "unset" }}
                />
              )}
              <AppButton
                variant="text"
                size="small"
                onClick={() => onSwitchMethod?.("TOTP")}
                style={{ color: theme.palette.primary.dark }}
                options={{ disabled: isBusy }}
              >
                <TransText
                  {...AUTH_BUTTON_LABELS.use_authenticator}
                  noComponent
                />
              </AppButton>
            </>
          )}
        </Stack>

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
