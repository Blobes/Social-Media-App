"use client";

import React, { useState } from "react";
import { Typography, Box, TypographyProps } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion, LayoutGroup } from "framer-motion";
import { AppButton } from "@repo/shared-ui";
import { GenericStyle } from "@repo/core";

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
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const words = text.split(/\s+/);
  const isTrimmable = words.length > wordLimit;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleClick) onToggleClick();
    setIsExpanded(!isExpanded);
  };

  // Logic to get the trimmed string
  const displayText =
    !isExpanded && isTrimmable
      ? words.slice(0, wordLimit).join(" ") + "..."
      : text;

  return (
    <Box sx={{ width: "100%", ...style?.container }}>
      <LayoutGroup>
        <Typography
          variant={variant}
          component={motion[component as keyof typeof motion] || motion.p}
          layout
          transition={{ type: "tween" }}
          sx={{
            color: "inherit",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            display: "inline",
          }}>
          <motion.span layout transition={{ duration: 0.2 }}>
            {displayText}
          </motion.span>{" "}
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
      </LayoutGroup>
    </Box>
  );
};
