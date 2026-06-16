"use client";

import React from "react";
import { CircularProgress, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { WordTrimmer, AppButton } from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { GenericStyle, SUPPORTED_ISO_CODES } from "@repo/core";
import { useCaptionTranslation } from "../hooks/useTranslation";

interface DynamicCaptionProps {
  captionId: string;
  caption: string;
  detectedLanguage?: string;
  style?: GenericStyle;
}

/**
 * Reusable layout wrapper providing instant inline translation actions for text contents.
 */
export const DynamicCaption: React.FC<DynamicCaptionProps> = ({
  captionId,
  caption,
  detectedLanguage = "en",
  style = {},
}) => {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const userLanguage = i18n.language || "en";

  const isDifferentLanguage =
    detectedLanguage.toLowerCase() !== userLanguage.toLowerCase();
  const isSupportedLanguage = SUPPORTED_ISO_CODES.includes(
    detectedLanguage.toLowerCase(),
  );

  const {
    translatedText,
    isFetching,
    isError,
    showingTranslation,
    toggleTranslation,
  } = useCaptionTranslation({
    postId: captionId,
    caption,
    sourceLang: detectedLanguage,
    targetLang: userLanguage,
  });

  const visibleText =
    showingTranslation && translatedText ? translatedText : caption;

  return (
    <Stack sx={{ width: "100%", ...style }}>
      <WordTrimmer
        text={visibleText}
        style={{
          container: {
            padding: theme.boxSpacing(4, 0),
            [theme.breakpoints.down("md")]: {
              padding: theme.boxSpacing(4, 6),
            },
          },
        }}
      />

      {isDifferentLanguage && isSupportedLanguage && (
        <Stack direction="row" justifyContent="flex-start" sx={{ mt: 1 }}>
          <AppButton
            variant="text"
            onClick={toggleTranslation}
            style={{
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "none",
              padding: 0,
              minWidth: "unset",
              width: "auto",
              "&:hover": { backgroundColor: "transparent" },
            }}
            options={{
              disabled: isFetching,
            }}>
            {isFetching ? (
              <>
                <CircularProgress size={12} color="inherit" sx={{ mr: 1 }} />
                Translating...
              </>
            ) : isError ? (
              "Retry Translation"
            ) : showingTranslation ? (
              "See Original"
            ) : (
              "See Translation"
            )}
          </AppButton>
        </Stack>
      )}
    </Stack>
  );
};
