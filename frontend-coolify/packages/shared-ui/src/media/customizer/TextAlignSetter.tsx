"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { TextAlignment } from "@repo/core";
import { ToggleBox } from "./ColorSetter";

export interface TextAlignSetterProps {
  textAlign?: TextAlignment;
  disabled?: boolean;
  onAlignmentChange: (newAlignment: TextAlignment) => void;
}

/**
 * Toggles text alignment between left, center, and right states.
 */
export const TextAlignSetter = ({
  textAlign = "center",
  disabled = false,
  onAlignmentChange,
}: TextAlignSetterProps) => {
  const alignments: TextAlignment[] = ["left", "center", "right"];
  const theme = useTheme();

  /**
   * Cycles through available text alignments on click.
   */
  const handleToggle = () => {
    const currentIndex = alignments.indexOf(textAlign);
    const nextAlignment = alignments[(currentIndex + 1) % alignments.length];
    onAlignmentChange(nextAlignment);
  };

  const Icon =
    textAlign === "left"
      ? AlignLeft
      : textAlign === "right"
        ? AlignRight
        : AlignCenter;

  return (
    <ToggleBox
      disabled={disabled}
      onClick={handleToggle}
      sx={{
        opacity: disabled ? 0.4 : 1,
        transition: "opacity 0.2s ease",
        backgroundColor: theme.fixedColors.grayTrans(0.12),
        "&:hover": { backgroundColor: theme.fixedColors.grayTrans(0.18) },
      }}>
      <Icon
        size={18}
        style={{ strokeWidth: 3, stroke: theme.fixedColors.gray50 }}
      />
    </ToggleBox>
  );
};
