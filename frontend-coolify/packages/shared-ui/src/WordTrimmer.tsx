"use client";

import React, { useId, useState } from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { COMMON_BUTTON_LABELS, GenericStyle } from "@repo/core";
import { AppButton } from "./Buttons";
import { useStaticTranslation } from "@repo/shared-hooks";
import { TransText } from "./Text";

interface WordTrimmerProps {
  text?: string;
  showMoreLabel?: string;
  showLessLabel?: string;
  children?: React.ReactNode;
  wordLimit?: number;
  component?: React.ElementType;
  style?: {
    textContent?: GenericStyle;
    container?: GenericStyle;
    btn?: GenericStyle;
  };
  onToggleClick?: () => void;
}

/**
 * Trims text based on word count with a smooth fade transition on toggle.
 */
export const WordTrimmer = ({
  children,
  text,
  wordLimit = 20,
  component = "p",
  style,
  showMoreLabel,
  showLessLabel,
  onToggleClick,
}: WordTrimmerProps) => {
  const { translateTxtString } = useStaticTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useTheme();
  // Unique structural ID linking the toggle control to the controlled text section
  const textContentId = useId();

  if (!text) return null;

  const words = text.split(/\s+/);
  const isTrimmable = words.length > wordLimit;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleClick) onToggleClick();
    setIsExpanded(!isExpanded);
  };

  const displayText =
    !isExpanded && isTrimmable
      ? words.slice(0, wordLimit).join(" ") + "..."
      : text;

  const activeLabel = isExpanded
    ? showLessLabel || translateTxtString(COMMON_BUTTON_LABELS.show_less)
    : showMoreLabel || translateTxtString(COMMON_BUTTON_LABELS.show_more);

  return (
    <Stack
      sx={{ width: "100%", alignItems: "flex-start", ...style?.container }}>
      <TransText
        component={motion[component as keyof typeof motion] || motion.p}
        sx={{
          ...theme.typography.text4,
          ...style?.textContent,
          color: "inherit",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          display: "inline",
        }}>
        {displayText}
      </TransText>

      {isTrimmable && (
        <AppButton
          variant="text"
          onClick={handleToggle}
          options={{
            "aria-expanded": isExpanded,
            "aria-controls": textContentId,
          }}
          style={{
            padding: 0,
            color: "inherit",
            borderRadius: 0,
            textDecoration: "underline",
            verticalAlign: "baseline",
            ...style?.btn,
            "&:hover": {
              bgcolor: "transparent",
              textDecoration: "underline",
              ...style?.btn?.["&:hover"],
            },
          }}>
          {activeLabel}
        </AppButton>
      )}
      {children}
    </Stack>
  );
};
