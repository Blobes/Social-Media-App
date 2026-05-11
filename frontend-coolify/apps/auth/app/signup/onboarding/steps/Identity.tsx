"use client";

import React from "react";
import { Stack, Typography } from "@mui/material";
import { AppButton, TextInput, ProgressIcon } from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { useIdentity } from "../hooks/useIdentity";

/**
 * Step 1: Identity UI utilizing the bulk-validated hook.
 */
export const Identity: React.FC<{ onNext: () => void }> = ({ onNext }) => {
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
          label="First Name"
          value={formData.firstName}
          onChange={handleChange}
        />

        <TextInput
          placeholder="Enter last name"
          label="Last Name"
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

        <AppButton
          variant="contained"
          submit
          options={{ disabled: !isFormValid || isPending }}>
          {isPending ? <ProgressIcon otherProps={{ size: 24 }} /> : "Proceed"}
        </AppButton>
      </Stack>
    </Stack>
  );
};
