"use client";

import React from "react";
import { Divider, Stack } from "@mui/material";
import {
  AppButton,
  TextInput,
  InlineMsgUI,
  ProgressIcon,
  DisplayList as CountryList,
  BasicTooltip,
  UIGuide as CredentialGuide,
  SVGWrapper,
  AnchorLink,
  TransText,
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import {
  AUTH_FEEDBACK,
  AUTH_INPUT,
  CLIENT_ROUTES,
  COMMON_BUTTON_LABELS,
  COMMON_FEEDBACK,
  ICountryItem,
  LISTS,
  ListType,
} from "@repo/core";
import { CircleQuestionMark } from "lucide-react";
import { useIdentifier } from "./hooks/useIdentifier";
import { LoginStepProps } from "../types";
import { asset } from "@repo/assets";
import { useGuides, useStaticTranslation } from "@repo/shared-hooks";

export const IdentifierStep: React.FC<LoginStepProps> = ({
  setStep,
  existingInput,
  setIdentifier,
  style = {},
}) => {
  const theme = useTheme();
  const { COUNTRY_LIST } = LISTS();
  const { translateTxtString } = useStaticTranslation();
  const { INPUT_GUIDES } = useGuides();

  const inlineTxtStyle = {
    color: theme.palette.primary.main,
    flex: "none",
    "&:hover": { textDecoration: "underline", fontWeight: 600 },
  };

  // Use the controller
  const {
    input,
    setInput,
    validity,
    validationMsg,
    isAuthLoading,
    handleChange,
    handleSubmit,
    isSubmitDisabled,
    countryMenuRef,
    validateAndSet,
    handleSignupClick,
    handleResetPassClick,
    inlineMsg,
  } = useIdentifier({ existingInput, setStep, setIdentifier });

  return (
    <Stack gap={theme.gap(8)}>
      <Stack
        gap={theme.gap(8)}
        sx={{
          paddingBottom: theme.boxSpacing(6),
          [theme.breakpoints.down("md")]: {
            paddingBottom: theme.boxSpacing(12),
          },
        }}>
        <TransText
          {...COMMON_FEEDBACK.predict_stake_win}
          component="h3"
          sx={{
            ...theme.typography.h5,
            color: theme.palette.gray[300],
            textAlign: "center",
            ...style.headline,
          }}
        />
        <TransText
          {...COMMON_FEEDBACK.user_terms_agreement}
          component="p"
          inlineComponents={{
            agreement: (
              <AnchorLink href="/user-agreement" style={inlineTxtStyle} />
            ),
            policy: (
              <AnchorLink href="/privacy-policy" style={inlineTxtStyle} />
            ),
          }}
          sx={{
            ...theme.typography.text4,
            color: theme.palette.gray[200],
            paddingBottom: theme.boxSpacing(2),
            textAlign: "center",
            ...style.tagline,
          }}
        />
      </Stack>

      {/* 3rd party sign in */}
      <Stack direction="row">
        <AppButton
          variant="outlined"
          style={{
            ...theme.typography.text3,
            padding: theme.boxSpacing(4.5, 9),
            gap: theme.gap(4),
            width: "100%",
          }}
          options={{ disabled: isAuthLoading }}>
          <SVGWrapper src={asset.googleLogo} size={20} />
          Google
        </AppButton>
        <AppButton
          variant="outlined"
          style={{
            ...theme.typography.text3,
            gap: theme.gap(4),
            padding: theme.boxSpacing(4.5, 9),
            width: "100%",
          }}
          options={{ disabled: isAuthLoading }}>
          <SVGWrapper
            src={asset.appleLogo}
            size={20}
            color={theme.palette.gray[300]}
          />
          Apple
        </AppButton>
      </Stack>

      <Divider
        sx={{
          ...theme.typography.text5,
          color: theme.palette.gray[200],
          margin: 0,
        }}>
        <TransText {...AUTH_FEEDBACK.or_sign_in_with} noComponent />
      </Divider>

      {/* Feedback */}
      {inlineMsg && <InlineMsgUI msg={inlineMsg} type="ERROR" />}

      {/* In app sign in */}
      <Stack
        sx={{ gap: theme.gap(10) }}
        component="form"
        onSubmit={handleSubmit}>
        <TextInput
          value={input}
          label={translateTxtString(AUTH_INPUT.label.email_phone_username)}
          placeholder={translateTxtString(
            AUTH_INPUT.placeholder.email_phone_username,
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
                  "&:hover": {
                    backgroundColor: theme.palette.gray.trans[1],
                  },
                }}>
                <CircleQuestionMark size={18} />
              </Stack>
            </BasicTooltip>
          }
          affixPosition="end"
        />
        {/* Country list popup */}
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
            container: {
              padding: 0,
            },
          }}
          onItemClick={(item) => {
            if (item?.code) {
              const newValue = `(+${item.code.replace(/\+/g, "")}) `;
              setInput(newValue);
              validateAndSet(newValue);
            }
          }}
        />
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
      </Stack>

      {/* Footer */}
      <Divider />
      <TransText
        {...COMMON_FEEDBACK.new_to_funstakes}
        component="p"
        sx={{ ...theme.typography.text4, textAlign: "center" }}
        inlineComponents={{
          anchor: (
            <AnchorLink
              href={CLIENT_ROUTES.signup.path}
              onClick={handleSignupClick}
              style={{
                ...inlineTxtStyle,
              }}
            />
          ),
        }}
      />
      <AnchorLink
        href={CLIENT_ROUTES.resetPassword.path}
        onClick={handleResetPassClick}
        style={{
          ...inlineTxtStyle,
        }}>
        <TransText {...COMMON_BUTTON_LABELS.reset_password} noComponent />
      </AnchorLink>
    </Stack>
  );
};
