"use client";

import React from "react";
import { Stack, Typography } from "@mui/material";
import { useGlobalStore } from "@repo/shared-hooks";
import {
  AppButton,
  TextInput,
  InlineMsg,
  ProgressIcon,
  DisplayList as CountryList,
  BasicTooltip,
  UIGuide as CredentialGuide,
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { ICountryItem, INPUT_GUIDES, LISTS, ListType } from "@repo/core";
import { CircleQuestionMark } from "lucide-react";
import { useIdentifier } from "./hooks/useIdentifier";
import { LoginStepProps } from "../types";

export const IdentifierStep: React.FC<LoginStepProps> = ({
  setStep,
  existingInput,
  setIdentifier,
  style = {},
}) => {
  const theme = useTheme();
  const inlineMsg = useGlobalStore((state) => state.inlineMsg);

  const { COUNTRY_LIST } = LISTS();

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
  } = useIdentifier({ existingInput, setStep, setIdentifier });

  return (
    <Stack gap={theme.gap(18)}>
      <Stack>
        <Typography
          component="h3"
          variant="h5"
          sx={{ fontWeight: 500, textAlign: "center", ...style.headline }}>
          Predict Events. Stake. Win together.
        </Typography>
        <Typography
          component="p"
          variant="body2"
          sx={{
            color: theme.palette.gray[200],
            paddingBottom: theme.boxSpacing(2),
            textAlign: "center",
            ...style.tagline,
          }}>
          Enter your credential to login.
        </Typography>
      </Stack>

      {inlineMsg && <InlineMsg msg={inlineMsg} type="ERROR" />}

      <Stack
        sx={{ gap: theme.gap(18) }}
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
                <CircleQuestionMark size={20} />
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
    </Stack>
  );
};
