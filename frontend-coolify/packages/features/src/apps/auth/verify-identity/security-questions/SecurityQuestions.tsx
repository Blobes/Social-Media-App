"use client";

import React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AppButton,
  InlineMsgUI,
  ProgressIcon,
  SVGWrapper,
  TransText,
  SelectInput,
  DynamicInput,
} from "@repo/shared-ui";
import { AUTH_BUTTON_LABELS, AUTH_FEEDBACK, TransitPurpose } from "@repo/core";
import { asset } from "@repo/assets";
import { useSecurityQuestions } from "./useSecurityQuestions";
import { BaseVerificationProps } from "../useVerifyIdentity";

/**
 * Security questions verification component.
 * Renders selectable questions and answer input fields for user identity verification.
 */
export const SecurityQuestions = <P extends TransitPurpose>(
  props: BaseVerificationProps<P>,
) => {
  const { style } = props;
  const theme = useTheme();

  const {
    questionStates,
    getOptionsForIndex,
    handleQuestionChange,
    handleAnswerChange,
    handleClear,
    isFormValid,
    isVerifying,
    handleVerify,
    inlineMsg,
  } = useSecurityQuestions(props);

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
          {...AUTH_FEEDBACK.verify_with_security_questions_headline}
          sx={{ ...theme.typography.h5, fontWeight: 500, textAlign: "center" }}
        />
        <TransText
          {...AUTH_FEEDBACK.verify_with_security_questions_tagline}
          style={{
            ...theme.typography.text3,
            color: theme.palette.gray[200],
            textAlign: "center",
          }}
        />
      </Stack>

      <Stack
        sx={{
          width: "100%",
          gap: theme.gap(16),
          alignItems: "center",
        }}
      >
        {!isVerifying && inlineMsg && (
          <InlineMsgUI msg={inlineMsg} type="ERROR" />
        )}

        {questionStates.map((qs, index) => (
          <Stack key={index} sx={{ width: "100%", gap: theme.gap(8) }}>
            <SelectInput
              label={`Security Question ${index + 1}`}
              placeholder="Select a question..."
              options={getOptionsForIndex(index)}
              selectedValue={qs.question}
              onSelectChange={(option) => handleQuestionChange(index, option)}
              onClear={() => handleClear(index)}
              disabled={isVerifying}
              allowReset
            />

            <DynamicInput
              label={`Answer ${index + 1}`}
              placeholder="Type your answer..."
              value={qs.answer}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              onClear={() => handleAnswerChange(index, "")}
              disabled={isVerifying || !qs.question}
              allowReset
            />
          </Stack>
        ))}

        <AppButton
          variant="contained"
          onClick={() => handleVerify()}
          style={{ width: "100%" }}
          options={{ disabled: !isFormValid || isVerifying }}
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
