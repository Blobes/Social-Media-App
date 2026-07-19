"use client";

import React from "react";
import { Stack } from "@mui/material";
import {
  AppButton,
  TextInput,
  InlineMsgUI,
  ProgressIcon,
  DisplayList as CountryList,
  BasicTooltip,
  UIGuide as CredentialGuide,
  TransText,
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  AUTH_INPUT,
  COMMON_BUTTON_LABELS,
  ICountryItem,
  LISTS,
  ListType,
} from "@repo/core";
import { CircleQuestionMark } from "lucide-react";
import { useGuides, useStaticTranslation } from "@repo/shared-hooks";
import { useReset } from "./useReset";
import { ResetStepProps } from "../../types";

/**
 * Primary identity resolution view checking credentials and binding target identifiers.
 */
export const CredentialStep: React.FC<ResetStepProps> = ({
  setStep,
  existingInput,
  setIdentifier,
  style = {},
}) => {
  const theme = useTheme();
  const { COUNTRY_LIST } = LISTS();
  const { translateTxtString } = useStaticTranslation();
  const { INPUT_GUIDES } = useGuides();

  const {
    input,
    setInput,
    validity,
    validationMsg,
    isAuthLoading,
    handleChange,
    isSubmitDisabled,
    countryMenuRef,
    validateAndSet,
    handleStandardSubmit,
    handleTFASubmit,
    inlineMsg,
  } = useReset({ existingInput, setStep });

  return (
    <Stack gap={theme.gap(8)} sx={{ width: "100%" }}>
      <Stack gap={theme.gap(8)} sx={{ paddingBottom: theme.boxSpacing(6) }}>
        <TransText
          {...AUTH_FEEDBACK.confirm_identity}
          component="h3"
          sx={{
            ...theme.typography.h5,
            color: theme.palette.gray[300],
            textAlign: "center",
            ...style.headline,
          }}
        />
        <TransText
          {...AUTH_FEEDBACK.lets_confirm_its_you}
          component="p"
          sx={{
            ...theme.typography.text4,
            color: theme.palette.gray[200],
            textAlign: "center",
            ...style.tagline,
          }}
        />
      </Stack>

      {inlineMsg && <InlineMsgUI msg={inlineMsg} type="ERROR" />}

      <Stack
        sx={{ gap: theme.gap(10) }}
        component="form"
        onSubmit={handleStandardSubmit}>
        <TextInput
          value={input}
          label={translateTxtString(AUTH_INPUT.label.email__or_phone)}
          placeholder={translateTxtString(
            AUTH_INPUT.placeholder.email_or_phone,
          )}
          onChange={handleChange}
          helperText={validationMsg}
          error={input !== "" && validity === "INVALID"}
          affix={
            <BasicTooltip
              title={
                <CredentialGuide
                  guides={[
                    INPUT_GUIDES.EMAIL,
                    INPUT_GUIDES.PHONE,
                    INPUT_GUIDES.USERNAME,
                  ]}
                />
              }>
              <Stack
                sx={{
                  cursor: "pointer",
                  borderRadius: theme.radius.full,
                  alignSelf: "center",
                  flex: "none",
                  padding: theme.boxSpacing(1),
                  "&:hover": { backgroundColor: theme.palette.gray.trans[1] },
                }}>
                <CircleQuestionMark size={18} />
              </Stack>
            </BasicTooltip>
          }
          affixPosition="end"
        />

        <CountryList<ICountryItem>
          menuRef={countryMenuRef}
          list={COUNTRY_LIST}
          listName={ListType.COUNTRY}
          showSearchBar
          stickToScreen={false}
          heightThreshold={65}
          style={{
            item: {
              padding: theme.boxSpacing(4, 8),
              gap: "10px",
              borderRadius: 0,
              "& svg": { width: "16px", height: "16px" },
            },
            container: { padding: 0 },
          }}
          onItemClick={(item) => {
            if (item?.code) {
              const newValue = `(+${item.code.replace(/\+/g, "")}) `;
              setInput(newValue);
              validateAndSet(newValue);
              setIdentifier?.(newValue);
            }
          }}
        />

        <Stack gap={theme.gap(4)}>
          <AppButton
            variant="contained"
            submit
            style={{
              ...theme.typography.text3,
              padding: theme.boxSpacing(5.5, 9),
              width: "100%",
            }}
            options={{ disabled: isSubmitDisabled }}>
            {isAuthLoading ? (
              <ProgressIcon otherProps={{ size: 25 }} />
            ) : (
              <TransText {...COMMON_BUTTON_LABELS.continue} noComponent />
            )}
          </AppButton>

          <AppButton
            variant="outlined"
            onClick={handleTFASubmit}
            style={{
              ...theme.typography.text3,
              padding: theme.boxSpacing(5.5, 9),
              width: "100%",
            }}
            options={{ disabled: isSubmitDisabled }}>
            <TransText
              {...AUTH_BUTTON_LABELS.verify_with_authenticator}
              noComponent
            />
          </AppButton>
        </Stack>
      </Stack>
    </Stack>
  );
};
