"use client";

import React from "react";
import { Divider, Stack, Typography } from "@mui/material";
import { useGlobalStore } from "@repo/shared-hooks";
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
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import {
  CLIENT_ROUTES,
  ICountryItem,
  INPUT_GUIDES,
  LISTS,
  ListType,
} from "@repo/core";
import { CircleQuestionMark } from "lucide-react";
import { useIdentifier } from "./hooks/useIdentifier";
import { LoginStepProps } from "../types";
import { asset } from "@repo/assets";

export const IdentifierStep: React.FC<LoginStepProps> = ({
  setStep,
  existingInput,
  setIdentifier,
  style = {},
}) => {
  const theme = useTheme();
  const { COUNTRY_LIST } = LISTS();

  const inlineTxtStlye = {
    color: theme.palette.primary.main,
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
    inlineMsg,
  } = useIdentifier({ existingInput, setStep, setIdentifier });

  return (
    <Stack gap={theme.gap(8)}>
      <Stack gap={theme.gap(8)} sx={{ paddingBottom: theme.boxSpacing(6) }}>
        <Typography
          component="h3"
          variant="h5"
          sx={{
            color: theme.palette.gray[300],
            textAlign: "center",
            ...style.headline,
          }}>
          Predict Events. Stake. Win together.
        </Typography>
        <Typography
          component="p"
          variant="body3"
          sx={{
            fontSize: 14,
            color: theme.palette.gray[200],
            paddingBottom: theme.boxSpacing(2),
            textAlign: "center",
            ...style.tagline,
          }}>
          By continuing, you agree to our{" "}
          <AnchorLink url="#" style={inlineTxtStlye}>
            User Agreement
          </AnchorLink>{" "}
          and acknowledge that you understand the{" "}
          <AnchorLink url="#" style={inlineTxtStlye}>
            Privacy Policy
          </AnchorLink>
          .
        </Typography>
      </Stack>

      {/* 3rd party sign in */}
      <Stack direction="row">
        <AppButton
          variant="outlined"
          style={{
            fontSize: "16px",
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
            fontSize: "16px",
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

      <Divider sx={{ fontSize: 14, color: theme.palette.gray[200], margin: 0 }}>
        Or sign in with
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
          label="Email, Phone or Username"
          placeholder="Email address, phone or username"
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
            fontSize: "16px",
            padding: theme.boxSpacing(5.5, 9),
            width: "100%",
          }}
          options={{ disabled: isSubmitDisabled }}>
          {isAuthLoading ? (
            <ProgressIcon otherProps={{ size: 25 }} />
          ) : (
            "Continue"
          )}
        </AppButton>
      </Stack>

      {/* Footer */}
      <Typography
        component="p"
        variant="body3"
        sx={{
          paddingBottom: theme.boxSpacing(2),
          textAlign: "center",
          ...style.tagline,
        }}>
        New to Funstakes?
        <AnchorLink
          variant="text"
          url={CLIENT_ROUTES.signup.path}
          onClick={handleSignupClick}
          style={{
            ...inlineTxtStlye,
            marginLeft: theme.boxSpacing(2),
          }}>
          Sign up
        </AnchorLink>
      </Typography>
    </Stack>
  );
};
