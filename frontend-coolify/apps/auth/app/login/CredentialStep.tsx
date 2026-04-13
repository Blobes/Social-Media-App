"use client";

import React from "react";
import { Stack, Typography } from "@mui/material";
import { useGlobalContext } from "@repo/shared-state";
import {
  AppButton,
  TextInput,
  InlineMsg,
  ProgressIcon,
  DisplayList as CountryList,
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { ICountryItem, LISTS, ListType } from "@repo/core";
import { Mail } from "lucide-react";
import { useCredential } from "./hooks/useCredential";
import { StepProps } from "../types";

export const CredentialStep: React.FC<StepProps> = ({
  setStep,
  existingInput,
  setCredential,
  style = {},
}) => {
  const theme = useTheme();
  const { inlineMsg } = useGlobalContext();

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
  } = useCredential({ existingInput, setStep, setCredential });

  return (
    <>
      <Stack>
        <Typography
          component="h3"
          variant="h5"
          sx={{ textAlign: "center", ...style.headline }}>
          Blobes Socials, A Place For Nigerians
        </Typography>
        <Typography
          component="p"
          variant="body2"
          sx={{
            color: theme.palette.gray[200],
            paddingBottom: theme.boxSpacing(8),
            textAlign: "center",
            ...style.tagline,
          }}>
          Enter your email address to continue.
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
            <Mail
              size={19}
              style={{ stroke: theme.palette.gray[200] as string }}
            />
          }
          affixPosition="end"
        />

        {/* Country list popup */}
        <CountryList<ICountryItem>
          menuRef={countryMenuRef}
          list={LISTS().COUNTRY_LIST}
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
    </>
  );
};
