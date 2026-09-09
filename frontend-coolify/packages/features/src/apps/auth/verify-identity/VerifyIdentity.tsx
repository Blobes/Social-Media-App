"use client";

import React, { useMemo } from "react";
import { Box, Divider, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Accordion, Stepper, TransText } from "@repo/shared-ui";
import {
  VerifyIdentityMethod,
  TransitPurpose,
  IStep,
  useGlobalStore,
  AUTH_BUTTON_LABELS,
} from "@repo/core";
import { useVerifyIdentity, VerifyIdentityProps } from "./useVerifyIdentity";
import { TotpView } from "./totp/Totp";
import { MessagingOtpView } from "./messaging/MessagingOtp";
import { Logout } from "../logout/Logout";
import { SecurityQuestions } from "./security-questions/SecurityQuestions";

/**
 * Primary identity verification controller handling dynamic method switching, step layouts,
 * and collapsible alternative verification methods.
 */
export const VerifyIdentity = <P extends TransitPurpose>(
  props: VerifyIdentityProps<P>,
) => {
  const {
    transitData,
    initialMethod,
    customMethods,
    onSuccess,
    onRateLimitExceeded,
    isBotChallengeAllowed,
    setShouldRestrict,
    containerStyle,
  } = props;

  const theme = useTheme();

  const {
    activeMethod,
    switchMethod,
    availableMethods,
    alternativeMethods,
    getMethodLabelProps,
    activeTransit,
    timeLeft,
  } = useVerifyIdentity({
    transitData,
    initialMethod,
    customMethods,
    setShouldRestrict,
  });
  const authStatus = useGlobalStore((state) => state.authStatus);

  const steps = useMemo<IStep<VerifyIdentityMethod>[]>(() => {
    const list: IStep<VerifyIdentityMethod>[] = [];

    if (availableMethods.includes("TOTP")) {
      list.push({
        name: "TOTP",
        element: (
          <TotpView
            activeTransit={activeTransit}
            onSuccess={onSuccess}
            onSwitchMethod={switchMethod}
            availableMethods={availableMethods}
            onRateLimitExceeded={onRateLimitExceeded}
            isBotChallengeAllowed={isBotChallengeAllowed}
          />
        ),
      });
    }

    if (availableMethods.includes("MESSAGING")) {
      list.push({
        name: "MESSAGING",
        element: (
          <MessagingOtpView
            activeTransit={activeTransit}
            onSuccess={onSuccess}
            onSwitchMethod={switchMethod}
            availableMethods={availableMethods}
            onRateLimitExceeded={onRateLimitExceeded}
            isBotChallengeAllowed={isBotChallengeAllowed}
          />
        ),
      });
    }

    if (availableMethods.includes("SECURITY_QUESTIONS")) {
      list.push({
        name: "SECURITY_QUESTIONS",
        element: (
          <SecurityQuestions
            activeTransit={activeTransit}
            onSuccess={onSuccess}
            onSwitchMethod={switchMethod}
            availableMethods={availableMethods}
            onRateLimitExceeded={onRateLimitExceeded}
            isBotChallengeAllowed={isBotChallengeAllowed}
          />
        ),
      });
    }

    return list;
  }, [
    availableMethods,
    activeTransit,
    onSuccess,
    switchMethod,
    onRateLimitExceeded,
    isBotChallengeAllowed,
  ]);

  /**
   * Constructs accordion item array for switching between secondary identity verification methods.
   */
  const alternativeMethodItems = useMemo(() => {
    if (alternativeMethods.length === 0) return [];

    return [
      {
        id: "alternative-methods",
        title: (
          <TransText
            {...AUTH_BUTTON_LABELS.other_verification_methods}
            sx={{
              ...theme.typography.text4,
              fontWeight: 600,
              color: theme.palette.primary.dark,
            }}
          />
        ),
        content: (
          <Stack
            sx={{
              width: "100%",
              gap: theme.gap(4),
              pt: theme.gap(2),
            }}
          >
            {alternativeMethods.map((targetMethod) => (
              <Box
                key={targetMethod}
                onClick={() => switchMethod(targetMethod)}
                sx={{
                  padding: theme.boxSpacing(4, 6),
                  borderRadius: `${theme.radius[2]}px`,
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                  "&:hover": {
                    backgroundColor: theme.fixedColors.pTrans,
                  },
                }}
              >
                <TransText
                  {...getMethodLabelProps(targetMethod)}
                  sx={{
                    ...theme.typography.text4,
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                  }}
                />
              </Box>
            ))}
          </Stack>
        ),
      },
    ];
  }, [alternativeMethods, getMethodLabelProps, switchMethod, theme]);

  return (
    <Stack
      sx={{
        width: "36%",
        minWidth: 300,
        maxWidth: 600,
        [theme.breakpoints.down("lg")]: { width: "50%" },
        [theme.breakpoints.down("sm")]: {
          width: "100%",
          minWidth: "unset",
          maxWidth: "unset",
        },
        alignItems: "center",
        gap: theme.gap(4),
        ...containerStyle,
      }}
    >
      {/* Session Timer UI */}
      <Box
        component="span"
        sx={{
          ...theme.typography.text4,
          color: theme.palette.primary.dark,
          background: theme.fixedColors.pTrans,
          padding: theme.boxSpacing(3, 5),
          borderRadius: theme.radius[2],
          textAlign: "center",
          fontWeight: 700,
          position: "absolute",
          top: 20,
          right: 30,
        }}
      >
        Session: {Math.floor(timeLeft / 60)}:
        {(timeLeft % 60).toString().padStart(2, "0")}
      </Box>

      <Stepper
        steps={steps}
        currStep={activeMethod}
        setCurrStep={(step) => switchMethod(step as VerifyIdentityMethod)}
      />

      {/* Accordion Method Switcher */}
      {alternativeMethods.length > 0 && (
        <Accordion
          items={alternativeMethodItems}
          style={{
            container: {
              width: "100%",
              marginTop: theme.gap(4),
            },
            item: {
              backgroundColor: "transparent",
              border: "none",
              "&.Mui-expanded": {
                borderColor: "transparent",
                boxShadow: "none",
              },
            },
            summary: {
              padding: 0,
              justifyContent: "center",
              "& .MuiAccordionSummary-content": {
                justifyContent: "center",
                flex: "unset",
              },
            },
            details: {
              padding: theme.boxSpacing(2, 0, 0, 0),
            },
          }}
        />
      )}

      {authStatus === "AUTHENTICATED" && (
        <>
          <Divider sx={{ width: "100%", marginY: theme.gap(8) }} />
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
  );
};
