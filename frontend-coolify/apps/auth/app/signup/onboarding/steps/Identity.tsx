"use client";

import React from "react";
import { IconButton, Stack, Typography } from "@mui/material";
import {
  AppButton,
  TextInput,
  ProgressIcon,
  BasicTooltip,
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { useIdentity } from "../hooks/useIdentity";
import { ChevronLeft } from "lucide-react";
import { AuthStepName, StepperProps } from "@repo/core";

/**
 * Step 1: Identity UI utilizing the bulk-validated hook.
 */
export const Identity: React.FC<StepperProps<AuthStepName>> = ({
  onNext,
  onPrev,
}) => {
  const theme = useTheme();
  const {
    formData,
    handleChange,
    submitIdentity,
    isPending,
    isFormValid,
    usernameStatus,
    setFormData,
  } = useIdentity(onNext);

  return (
    <Stack sx={{ gap: theme.gap(18), width: "100%" }}>
      <Stack sx={{ textAlign: "center" }}>
        <Typography variant="h5" fontWeight={600}>
          Confirm your identity
        </Typography>
        <Typography variant="body2" color={theme.palette.gray[200]}>
          Set up your legal names and unique handle.
        </Typography>
      </Stack>

      <Stack
        component="form"
        sx={{ gap: theme.gap(12) }}
        onSubmit={(e) => {
          e.preventDefault();
          submitIdentity();
        }}>
        <TextInput
          placeholder="Enter first name"
          label="First name"
          value={formData.firstName}
          onChange={handleChange}
        />

        <TextInput
          placeholder="Enter last name"
          label="Last name"
          value={formData.lastName}
          onChange={handleChange}
        />

        <TextInput
          placeholder="Enter username"
          label="Username"
          value={formData.username}
          onChange={handleChange}
          error={usernameStatus.status === "TAKEN"}
          helperText={
            usernameStatus.status === "TAKEN" ? "Username already exists." : ""
          }
        />

        {usernameStatus.status === "TAKEN" && usernameStatus.suggestions && (
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {usernameStatus.suggestions.map((sug) => (
              <Typography
                key={sug}
                variant="caption"
                onClick={() => setFormData({ ...formData, username: sug })}
                sx={{ cursor: "pointer", color: theme.palette.primary.main }}>
                {sug}
              </Typography>
            ))}
          </Stack>
        )}
        <Stack direction="row">
          {/* Navigate backward */}
          {/* <BasicTooltip title={"Previous"}>
            <IconButton
              sx={{
                padding: theme.boxSpacing(3, 4),
                color: theme.palette.gray[200],
                border: `1px solid ${theme.palette.gray.trans[1]}`,
                borderRadius: theme.radius[3],
                width: "48px",
                backgroundColor: theme.fixedColors.pTrans,
              }}
              onClick={() => {
                if (onPrev) onPrev();
              }}>
              <ChevronLeft
                style={{ width: "20px", stroke: theme.palette.gray[200] }}
              />
            </IconButton>
          </BasicTooltip> */}

          {/* Proceed to next */}
          <AppButton
            variant="contained"
            style={{
              fontSize: "16px",
              padding: theme.boxSpacing(5.5, 9),
              width: "100%",
            }}
            submit
            options={{ disabled: !isFormValid || isPending }}>
            {isPending ? <ProgressIcon otherProps={{ size: 24 }} /> : "Proceed"}
          </AppButton>
        </Stack>
      </Stack>
    </Stack>
  );
};
