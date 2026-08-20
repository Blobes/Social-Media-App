"use client";

import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Turnstile } from "@marsidev/react-turnstile";
import { InlineMsgUI } from "./InlineMsg";
import { AppButton } from "./Buttons";
import { UseBotOptions, useBotVerification } from "@repo/shared-hooks";

/**
 * Renders a verification interface integrated with Cloudflare Turnstile bot protection.
 */
export const BotVerification: React.FC<UseBotOptions> = ({
  currStep,
  setCurrStep,
  onSuccess,
  buttonText,
}) => {
  const theme = useTheme();

  const {
    token,
    isSubmitting,
    errorMessage,
    siteKey,
    label,
    setErrorMessage,
    handleVerify,
    handleExpire,
    handleClick,
  } = useBotVerification({
    currStep,
    setCurrStep,
    onSuccess,
    buttonText,
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        gap: theme.gap(2),
      }}>
      {errorMessage && (
        <InlineMsgUI
          msg={errorMessage}
          type="ERROR"
          onClose={() => setErrorMessage(null)}
        />
      )}

      <Turnstile
        siteKey={siteKey}
        onSuccess={handleVerify}
        onExpire={handleExpire}
        options={{
          theme: "auto",
          size: "normal",
        }}
      />

      <AppButton
        onClick={handleClick}
        options={{
          disabled: !token || isSubmitting,
        }}>
        {isSubmitting ? "Processing..." : label}
      </AppButton>
    </Box>
  );
};
