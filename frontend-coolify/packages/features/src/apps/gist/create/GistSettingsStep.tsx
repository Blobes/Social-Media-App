"use client";

import React from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AppButton, InlineMsgUI, ProgressIcon } from "@repo/shared-ui";
import { PostStepName, StepperProps } from "@repo/core";

export interface SettingsStepProps extends StepperProps<PostStepName> {
  hasSensitiveGraphic?: boolean;
  setHasSensitiveGraphic?: (val: boolean) => void;
  isProcessing: boolean;
  inlineErrMsg: string | null;
  handleGistPublish: (e: React.SubmitEvent) => void;
}

/**
 * Standardized secondary configuration panel processing parameters and publishing actions.
 */
export const GistSettingsStep: React.FC<SettingsStepProps> = ({
  step,
  setStep,
  hasSensitiveGraphic,
  setHasSensitiveGraphic,
  isProcessing,
  inlineErrMsg,
  handleGistPublish,
}) => {
  const theme = useTheme();

  return (
    <Box
      component="form"
      onSubmit={handleGistPublish}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: theme.gap(7.5),
      }}>
      <Stack sx={{ gap: theme.gap(2) }}>
        <Typography variant="subtitle1" sx={{ color: theme.palette.gray[300] }}>
          Gist Settings
        </Typography>

        {!isProcessing && inlineErrMsg && (
          <InlineMsgUI msg={inlineErrMsg} type="ERROR" />
        )}
      </Stack>

      <Stack sx={{ flexDirection: "row", gap: theme.gap(4), flexWrap: "wrap" }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={hasSensitiveGraphic}
              disabled={isProcessing}
              onChange={(e) => setHasSensitiveGraphic?.(e.target.checked)}
              sx={{
                color: theme.palette.gray[100],
                "&.Mui-checked": { color: theme.palette.error.main },
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: theme.palette.gray[200] }}>
              Flag sensitive graphics (blur preview)
            </Typography>
          }
        />
      </Stack>

      <Stack sx={{ flexDirection: "row", gap: theme.gap(4), width: "100%" }}>
        <AppButton
          variant="outlined"
          onClick={() => setStep?.("CONTENT")}
          options={{ disabled: isProcessing }}
          style={{ flex: 1, padding: theme.boxSpacing(6, 0) }}>
          Back
        </AppButton>

        <AppButton
          variant="contained"
          submit
          options={{
            disabled: isProcessing,
          }}
          style={{
            flex: 2,
            padding: theme.boxSpacing(6, 0),
            gap: "10px",
          }}>
          {isProcessing ? (
            <>
              <ProgressIcon style={{ width: "20px", height: "20px" }} />
              <Typography variant="button">
                Syncing Cluster Elements...
              </Typography>
            </>
          ) : (
            <Typography variant="button">Publish Post</Typography>
          )}
        </AppButton>
      </Stack>
    </Box>
  );
};
