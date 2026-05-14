"use client";

import React, { useState } from "react";
import { Typography, Box, TypographyProps, Stack } from "@mui/material";
import { motion } from "framer-motion";
import { GenericStyle } from "@repo/core";
import { AppButton } from "./Buttons";

interface WordTrimmerProps {
  children?: React.ReactNode;
  text: string;
  wordLimit?: number;
  variant?: TypographyProps["variant"];
  component?: React.ElementType;
  style?: { container?: GenericStyle; btn?: GenericStyle };
  showMoreLabel?: string;
  showLessLabel?: string;
  onToggleClick?: () => void;
}

/**
 * Trims text based on word count with a smooth fade transition on toggle.
 */
export const WordTrimmer = ({
  children,
  text,
  wordLimit = 20,
  variant = "body2",
  component = "p",
  style,
  showMoreLabel = "Show more",
  showLessLabel = "Show less",
  onToggleClick,
}: WordTrimmerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
    <Stack sx={{ width: "100%", ...style?.container }}>
      <Typography
        variant={variant}
        component={motion[component as keyof typeof motion] || motion.p}
        sx={{
          color: "inherit",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          display: "inline",
        }}>
        {displayText}

        {isTrimmable && (
          <AppButton
            variant="text"
            onClick={handleToggle}
            style={{
              p: 0,
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
            {isExpanded ? showLessLabel : showMoreLabel}
          </AppButton>
        )}
        {children}
      </Typography>
    </Stack>
  );
};
