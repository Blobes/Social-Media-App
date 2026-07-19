"use client";

import React from "react";
import { Stack, ButtonGroup, Switch, FormControlLabel } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  useAccessibilityStore,
  FontScaleLevel,
  DensityPreference,
} from "@repo/core";
import { AppButton } from "./Buttons";
import { TransText } from "./Text";

/**
 * Controls user-preferred layouts and accessibility profiles.
 */
export const PreferencesPanel = () => {
  const {
    fontScale,
    contrastMode,
    motion,
    density,
    dyslexiaFont,
    setPreferences,
    resetPreferences,
  } = useAccessibilityStore();
  const theme = useTheme();

  return (
    <Stack sx={{ padding: 4, width: "100%", maxWidth: "400px" }}>
      <TransText sx={{ ...theme.typography.h6, marginBottom: 4 }}>
        Display & Accessibility Settings
      </TransText>

      {/* Font Scale Selection */}
      <Stack sx={{ marginBottom: 3 }}>
        <TransText sx={{ ...theme.typography.text3, marginBottom: 1 }}>
          Text Zoom Profile
        </TransText>
        <ButtonGroup variant="outlined" size="small" fullWidth>
          {(
            ["small", "normal", "large", "extra-large"] as FontScaleLevel[]
          ).map((level) => (
            <AppButton
              key={level}
              onClick={() => setPreferences({ fontScale: level })}
              variant={fontScale === level ? "contained" : "outlined"}>
              {level.replace("-", " ")}
            </AppButton>
          ))}
        </ButtonGroup>
      </Stack>

      {/* Spacing Density Configurations */}
      <Stack sx={{ marginBottom: 3 }}>
        <TransText sx={{ ...theme.typography.text3, marginBottom: 1 }}>
          Layout Spacing Profile
        </TransText>
        <ButtonGroup variant="outlined" size="small" fullWidth>
          {(["comfortable", "compact"] as DensityPreference[]).map((d) => (
            <AppButton
              key={d}
              onClick={() => setPreferences({ density: d })}
              variant={density === d ? "contained" : "outlined"}>
              {d}
            </AppButton>
          ))}
        </ButtonGroup>
      </Stack>

      {/* High Contrast Selection */}
      <FormControlLabel
        control={
          <Switch
            checked={contrastMode === "high"}
            onChange={(e) =>
              setPreferences({
                contrastMode: e.target.checked ? "high" : "normal",
              })
            }
          />
        }
        label="Enhanced Color Contrast"
        sx={{ marginBottom: 1 }}
      />

      {/* Reduced Motion Toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={motion === "reduced"}
            onChange={(e) =>
              setPreferences({ motion: e.target.checked ? "reduced" : "full" })
            }
          />
        }
        label="Reduce Animation Motion"
        sx={{ marginBottom: 1 }}
      />

      {/* Dyslexia Font Layer */}
      <FormControlLabel
        control={
          <Switch
            checked={dyslexiaFont}
            onChange={(e) => setPreferences({ dyslexiaFont: e.target.checked })}
          />
        }
        label="Use OpenDyslexic Font"
        sx={{ marginBottom: 4 }}
      />

      <AppButton
        variant="outlined"
        style={{ width: "100%" }}
        onClick={resetPreferences}>
        Reset System Parameters
      </AppButton>
    </Stack>
  );
};
